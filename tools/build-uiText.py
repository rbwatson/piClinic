# coding=utf-8
#
#  Copyright (c) 2026 by Robert B. Watson
#
#  Permission is hereby granted, free of charge, to any person obtaining a copy of
#  this software and associated documentation files (the "Software"), to deal in
#  the Software without restriction, including without limitation the rights to
#  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
#  of the Software, and to permit persons to whom the Software is furnished to do
#  so, subject to the following conditions:
#
#  The above copyright notice and this permission notice shall be included in all
#  copies or substantial portions of the Software.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
#  SOFTWARE.
#
#
#   script to create UI Text string files to include with PHP script files (v1)
#   or JSON locale files for the React frontend (v2)
#
#       Command line format:
#
#           v1: build-uiText.py --version v1 --infile uitext/UIText.csv --srcpath www/
#           v2: build-uiText.py --version v2 --infile uitext/UITextV2.csv
#                               --srcpath frontend/src/ --outpath frontend/src/locales/
# 

import sys
import platform
import os
import os.path
import re
import csv
import json
import codecs
import argparse

csv_source_file = 'SourceFile'
csv_constant    = 'UI_TEXT_CONSTANT'
csv_v2_key      = 'UI_V2_KEY'
csv_en          = 'UI_ENGLISH_LANGUAGE'
csv_es          = 'UI_SPANISH_LANGUAGE'

# Language column names in UITextV2.csv mapped to output filenames
V2_LANGUAGES = {
    csv_en: 'en.json',
    csv_es: 'es.json',
}

copyrightText = """ *
 * Copyright (c) 2022 by Robert B. Watson
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of
 *  this software and associated documentation files (the "Software"), to deal in
 *  the Software without restriction, including without limitation the rights to
 *  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 *  of the Software, and to permit persons to whom the Software is furnished to do
 *  so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
"""

accessTest = """
// check to make sure this file wasn't called directly
//  it must be called from a script that supports access checking
$apiCommonInclude = dirname(__FILE__).'/../api/api_common.php';
if (!file_exists($apiCommonInclude)) {
    $apiCommonInclude = dirname(__FILE__).'/../../api/api_common.php';
    if (!file_exists($apiCommonInclude)) {
        $apiCommonInclude = dirname(__FILE__).'/../../../api/api_common.php';
    }
}
require_once $apiCommonInclude;
exitIfCalledFromBrowser(__FILE__);

"""

how = """Tool to build localized strings for piClinic files.

v2: Scans .ts/.tsx files in --srcpath for t('KEY') calls,
    Confirms that all keys exist in UITextV2.csv,
    Checks parity across all language columns,
    Then, writes en.json and es.json to --outpath.

    v2 command line:
        python build-uiText.py --version v2 --infile uitext/UITextV2.csv
                    --srcpath frontend/src/ --outpath frontend/src/locales/

v1: Scans .php files in --srcpath for TEXT_* constants,
    writes per-file uitext/*.php include files using source strings from UIText.csv.

    v1 command line:
        python build-uiText.py --version v1 --infile uitext/UIText.csv --srcpath www/

    How to create localize strings for the piClinic files:
    1. Create your localized strings in a .csv file. The piClinic uses /uitext/UIText.csv.
    2. Use the localized string constants for any literal text in the .php files.
        a. The string constant names used in a .php file and the .csv file must start with "TEXT_".
        b. The piClinic supports English and Spanish, but additional languages can be added 
            as new columns to the .csv file after these two.
    3. When you run this tool, it reads the .php files in the directory specified by
        the srcpath parameter and looks for the presence of TEXT_* string constants.
        a. For each file in the directory that uses at least one of these constants:
            i. The instances of TEXT_* are read from the .php file.
            ii. Each instance is located in the .csv file
            iii. The instance is formatted and written to a string file for that .php file.        
        b. The string files created:
            i. Are locted in the uitext subdirectory of the directory with the .php file.
            ii. Have a file name that is the .php file's name + "Text". (e.g. MyFile.php would
                have as a text file: uitext/MyFileText.php)
    4. You can use the --build=all parameter to build all text files, or omit the --build parameter
        to build text files for only those .php files that are newer than the .csv file.
    
"""

cliParser = argparse.ArgumentParser(prog="build-uiText.py", usage=how)
cliParser.add_argument('-v', '--version', required=False, choices=['v1', 'v2'], default='v2',
    help='v1 creates .php include files; v2 creates JSON locale files. Default: v2.')
cliParser.add_argument('--build', required=False, choices=["new", "all"], default="new",
    help="v1 only: new=update changed files, all=rebuild all files.")
cliParser.add_argument('--infile', required=True,
    help="Path to the CSV input file with source strings.")
cliParser.add_argument('--srcpath', required=False, default='./',
    help="v1: directory with .php files. v2: directory to scan for t() calls.")
cliParser.add_argument('--outpath', required=False, default=None,
    help="v2 only: directory where en.json and es.json will be written.")


# ---------------------------------------------------------------------------
# v2 helpers
# ---------------------------------------------------------------------------

def scan_source_for_t_calls(srcpath):
    """
    Walk srcpath recursively for .ts and .tsx files.
    Returns:
        static_keys  : set of string key names from t('KEY') or t("KEY")
        dynamic_calls: list of (filepath, line_number, matched_text) for
                       t(`...`) or t(variable) patterns
    """
    static_re  = re.compile(r"""t\(\s*['"]([A-Z][A-Z0-9_]+)['"]\s*\)""")
    dynamic_re = re.compile(r"""t\(`([^`]*\$\{[^`]*\}[^`]*)`\)""")

    static_keys   = set()
    dynamic_calls = []

    for root, dirs, files in os.walk(srcpath):
        # Skip test files — they use translation keys as mock return values
        dirs[:] = [d for d in dirs if d not in ['test', '__tests__', 'node_modules']]
        for filename in files:
            if not filename.endswith(('.ts', '.tsx')):
                continue
            if filename.endswith('.test.ts') or filename.endswith('.test.tsx'):
                continue
            filepath = os.path.join(root, filename)
            with codecs.open(filepath, 'r', 'utf-8', errors='replace') as f:
                for lineno, line in enumerate(f, 1):
                    for match in static_re.finditer(line):
                        static_keys.add(match.group(1))
                    for match in dynamic_re.finditer(line):
                        dynamic_calls.append((filepath, lineno, match.group(0).strip()))

    return static_keys, dynamic_calls


def read_v2_csv(csvfile):
    """
    Read UITextV2.csv and return a dict keyed by UI_V2_KEY.
    Each value is a dict of { language_col: string_value }.
    """
    rows = {}
    with codecs.open(csvfile, 'r', 'utf-8', errors='strict') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = row.get(csv_v2_key, '').strip()
            if key:
                rows[key] = {col: row[col].strip() for col in row if col != csv_v2_key}
    return rows


def check_coverage(static_keys, csv_rows):
    """
    Verify every static key found in source exists in the CSV.
    Returns list of missing key names.
    """
    missing = sorted(k for k in static_keys if k not in csv_rows)
    return missing


def check_parity(csv_rows):
    """
    Verify every key has a non-empty value for every language column.
    Returns list of (key, language_col) tuples where the value is blank.
    """
    gaps = []
    for key, langs in sorted(csv_rows.items()):
        for lang_col in V2_LANGUAGES:
            if not langs.get(lang_col, '').strip():
                gaps.append((key, lang_col))
    return gaps


def write_json_files(csv_rows, outpath):
    """
    Write one JSON file per language to outpath.
    Keys are sorted alphabetically for stable diffs.
    """
    os.makedirs(outpath, exist_ok=True)
    for lang_col, filename in V2_LANGUAGES.items():
        output = {key: vals[lang_col] for key, vals in csv_rows.items()}
        output_sorted = dict(sorted(output.items()))
        outfile = os.path.join(outpath, filename)
        with codecs.open(outfile, 'w', 'utf-8') as f:
            json.dump(output_sorted, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  Written: {outfile} ({len(output_sorted)} keys)')


def createV2Files(arg_csvfile, arg_srcpath, arg_outpath):
    """
    v2 workflow:
      1. Scan source for static and dynamic t() calls
      2. Check coverage  — error if any static key is missing from CSV
      3. Check parity    — error if any CSV key is blank in any language
      4. Write JSON files (only if both checks pass)
      5. Print dynamic-key reminder
    """
    errors_found = False

    # -- Read CSV --
    if not os.path.isfile(arg_csvfile):
        print(f'ERROR: CSV file not found: {arg_csvfile}')
        return 0

    print(f'Reading: {arg_csvfile}')
    csv_rows = read_v2_csv(arg_csvfile)
    print(f'  {len(csv_rows)} keys loaded from CSV.')

    # -- Step 1: Scan source --
    print(f'\nScanning source files in: {arg_srcpath}')
    static_keys, dynamic_calls = scan_source_for_t_calls(arg_srcpath)
    print(f'  {len(static_keys)} unique static keys found.')
    print(f'  {len(dynamic_calls)} dynamic t() calls found.')

    # -- Step 2: Coverage check --
    print('\nChecking coverage (all source keys present in CSV)...')
    missing = check_coverage(static_keys, csv_rows)
    if missing:
        errors_found = True
        print(f'  COVERAGE ERROR: {len(missing)} key(s) used in source but missing from CSV:')
        for key in missing:
            print(f'    {key}')
    else:
        print('  OK — all static keys are present in the CSV.')

    # -- Step 3: Parity check --
    print('\nChecking parity (all keys have values in every language)...')
    gaps = check_parity(csv_rows)
    if gaps:
        errors_found = True
        print(f'  PARITY ERROR: {len(gaps)} blank value(s) found in CSV:')
        for key, lang_col in gaps:
            print(f'    {key}  [{lang_col}]')
    else:
        print('  OK — all keys have values in every language.')

    # -- Abort before writing if any errors --
    if errors_found:
        print('\nERROR: Validation failed. No files were written.')
        print('       Fix the errors above and run again.')
        return 0

    # -- Step 4: Write JSON files --
    if not arg_outpath:
        print('\nERROR: --outpath is required for v2. No files written.')
        return 0

    print(f'\nWriting locale files to: {arg_outpath}')
    write_json_files(csv_rows, arg_outpath)

    # -- Step 5: Dynamic key reminder --
    if dynamic_calls:
        print(f'\nNOTE: {len(dynamic_calls)} dynamic t() call(s) found — verify these keys')
        print('      are in UITextV2.csv manually:')
        for filepath, lineno, text in sorted(dynamic_calls):
            # Show path relative to srcpath for readability
            try:
                rel = os.path.relpath(filepath, arg_srcpath)
            except ValueError:
                rel = filepath
            print(f'    {rel}:{lineno}  {text}')

    print(f'\nDone. {len(csv_rows)} keys written to {len(V2_LANGUAGES)} language files.')
    return len(V2_LANGUAGES)


# ---------------------------------------------------------------------------
# v1 (unchanged)
# ---------------------------------------------------------------------------

def createStringsInFiles(file_info):
    with codecs.open(file_info['text'], 'w', 'utf-8') as outFile:
        outFile.write("<?php\n/*\n")
        outFile.write(copyrightText)
        outFile.write(" *\n */\n")
        outFile.write(accessTest)
        lang_idx = 0
        for language in file_info['langs']:
            langField = language
            if langField == 'UITEST_LANGUAGE':
                langField = 'UI_TEXT_CONSTANT'
            outFile.write("// Strings for {}\nif ($pageLanguage == {}) {}\n".format(
                language, language, '{'))
            if 'file_strings' in file_info:
                for uiTextItem in file_info['file_strings']:
                    outFile.write(
                        "\tif (!defined('{}')) {{ define('{}','{}',false); }}\n".format(
                            uiTextItem['UI_TEXT_CONSTANT'],
                            uiTextItem['UI_TEXT_CONSTANT'],
                            uiTextItem[langField]))
                outFile.write("{}\n".format('}'))
    return 1


def getLangStrings(csv_rows, string):
    for row in csv_rows:
        if row['UI_TEXT_CONSTANT'] == string:
            return row
    return None


def createTextFiles(file_list, csv_rows, langs):
    sortedCsvRows = sorted(csv_rows, key=lambda k: k[csv_constant])
    for file_info in file_list:
        print('Creating: ', file_info['text'])
        file_strings = []
        if file_info['strings']:
            for string in file_info['strings']:
                langStrings = getLangStrings(sortedCsvRows, string)
                if langStrings:
                    file_strings.append(langStrings)
                    file_info['file_strings'] = file_strings
                else:
                    print("****String not defined for symbol: " + string)
            file_info['langs'] = langs
            createStringsInFiles(file_info)


def createV1Files(arg_build, arg_csvfile, arg_codedir):
    file_count = 0
    if not os.path.isfile(arg_csvfile):
        print(arg_csvfile, ' was not found.')
        return file_count

    csv_file_date = os.path.getmtime(arg_csvfile)

    with codecs.open(arg_csvfile, 'r', 'utf-8', "strict") as csv_file:
        csv_read = csv.DictReader(csv_file)
        csv_rows = [row for row in csv_read]
        csv_fields = csv_rows[0].keys()
        langs = ['UITEST_LANGUAGE']
        for key in csv_fields:
            if key != csv_constant:
                langs.append(key)
        if csv_constant not in csv_fields:
            print('CSV file is missing required column(s)')

    path_char = '\\' if platform.system() == 'Windows' else '/'
    files = [f for f in os.listdir(arg_codedir)
             if os.path.isfile(arg_codedir + path_char + f)]

    php_files = []
    for file in files:
        if file[-4:] not in ['.php', '.svg']:
            continue
        if file[-8:] == 'Text.php':
            continue
        newFile = {}
        newFile['source'] = arg_codedir + path_char + file
        newFile['text'] = (arg_codedir + path_char + 'uitext' +
                           path_char + file[:-4] + 'Text.php')
        if arg_build == 'new':
            if os.path.isfile(newFile['text']):
                if os.path.getmtime(newFile['source']) < os.path.getmtime(newFile['text']):
                    if os.path.getmtime(newFile['text']) > csv_file_date:
                        print('Skipping ' + newFile['source'] +
                              ' because the text file is newer than the source files.')
                        continue
        php_files.append(newFile)

    print('{} files to update.'.format(len(php_files)))
    for php_file in php_files:
        with open(php_file['source'], "r") as source_file:
            text_vars = []
            for line in source_file:
                matches = re.findall('TEXT_[0-9A-Z_]+', line)
                for match in matches:
                    text_vars.append(match)
        php_file['strings'] = sorted(set(text_vars))

    createTextFiles(php_files, csv_rows, langs)
    return file_count


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    args = cliParser.parse_args()
    arg_build   = args.build
    arg_csvfile = args.infile
    arg_codedir = args.srcpath
    arg_outpath = args.outpath
    arg_version = args.version

    if arg_version == 'v1':
        print('Running v1: creating .php include files.')
        filesCreated = createV1Files(arg_build, arg_csvfile, arg_codedir)
        if filesCreated == 0:
            sys.exit(1)
    elif arg_version == 'v2':
        if not arg_outpath:
            print('Error: --outpath is required for v2.')
            sys.exit(1)
        else:
            print('Running v2: creating JSON locale files.')
            filesCreated = createV2Files(arg_csvfile, arg_codedir, arg_outpath)
            if filesCreated == 0:
                sys.exit(1)
    else:
        print('Invalid version. Use --version v1 or --version v2.')
        sys.exit(1)

    # if it hasn't exited with an error by now, it was successful.
    sys.exit(0)

if __name__ == '__main__':
    main()