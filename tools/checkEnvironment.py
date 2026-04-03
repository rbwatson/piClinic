#!/usr/bin/env python3
"""
checkEnvironment.py - Verify piClinic environment against a config file.

Usage:
    python3 checkEnvironment.py [--config piclinic_config.json]

Reads a JSON config file describing checks to run (HTTP requests or shell
commands), verifies each returns expected content, and reports failures with
remediation guidance. Exits non-zero if any check fails.
"""

import argparse
import getpass
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request


def load_config(path):
    with open(path) as f:
        return json.load(f)


def collect_prompts(checks):
    """Collect all unique promptFor variables across all checks, prompt once each."""
    seen = {}
    for check in checks:
        for prompt_def in check.get("promptFor", []):
            var = prompt_def["var"]
            if var not in seen:
                seen[var] = prompt_def
    values = {}
    for var, defn in seen.items():
        label = defn.get("prompt", var)
        secret = defn.get("secret", False)
        if secret:
            values[var] = getpass.getpass(f"{label}: ")
        else:
            values[var] = input(f"{label}: ")
    return values


def substitute_vars(text, variables):
    """Replace ${VAR} placeholders with values from variables dict."""
    def replacer(match):
        key = match.group(1)
        return variables.get(key, match.group(0))
    return re.sub(r'\$\{([^}]+)\}', replacer, text)


def run_http_check(check):
    """Fetch a URL and return (success, output, error_message)."""
    url = check["target"]
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            body = resp.read().decode("utf-8", errors="replace")
        return body, None
    except urllib.error.HTTPError as e:
        return "", f"HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return "", f"Connection failed: {e.reason}"
    except Exception as e:
        return "", str(e)


def run_command_check(check, variables):
    """Run a shell command and return (output, error_message)."""
    raw_cmd = check["target"]
    cmd = substitute_vars(raw_cmd, variables)
    workdir = check.get("workdir")
    if workdir:
        workdir = os.path.expanduser(workdir)

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=workdir,
            capture_output=True,
            text=True,
            timeout=30,
        )
        combined = result.stdout + result.stderr
        if result.returncode != 0 and not combined.strip():
            return "", f"Command exited with code {result.returncode}"
        return combined, None
    except subprocess.TimeoutExpired:
        return "", "Command timed out after 30 seconds"
    except Exception as e:
        return "", str(e)


def evaluate_check(output, expect):
    """Return list of missing expected strings (empty list = pass)."""
    return [marker for marker in expect if marker not in output]


def run_checks(config, variables):
    checks = config.get("checks", [])
    results = []
    for check in checks:
        name = check.get("name", check.get("target", "unnamed"))
        check_type = check.get("type", "command")
        expect = check.get("expect", [])
        solution = check.get("solution", "No solution provided.")

        print(f"  Checking: {name} ...", end=" ", flush=True)

        if check_type == "http":
            output, err = run_http_check(check)
        else:
            output, err = run_command_check(check, variables)

        if err:
            print("FAIL")
            results.append({
                "name": name,
                "passed": False,
                "reason": err,
                "solution": solution,
            })
            continue

        missing = evaluate_check(output, expect)
        if missing:
            print("FAIL")
            results.append({
                "name": name,
                "passed": False,
                "reason": f"Expected text not found: {missing}",
                "solution": solution,
            })
        else:
            print("OK")
            results.append({"name": name, "passed": True})

    return results


def report(results):
    failures = [r for r in results if not r["passed"]]
    total = len(results)
    passed = total - len(failures)

    print()
    print(f"Results: {passed}/{total} checks passed")

    if failures:
        print()
        print("=" * 60)
        print("FAILURES")
        print("=" * 60)
        for f in failures:
            print(f"\n[FAIL] {f['name']}")
            print(f"  Reason:   {f['reason']}")
            print("  Solution:")
            for line in f["solution"].splitlines():
                print(f"    {line}")

    return len(failures)


def main():
    parser = argparse.ArgumentParser(
        description="Verify piClinic environment against a config file."
    )
    parser.add_argument(
        "--config",
        default="piclinic_config.json",
        help="Path to the JSON config file (default: piclinic_config.json)",
    )
    args = parser.parse_args()

    if not os.path.isfile(args.config):
        print(f"Error: config file not found: {args.config}", file=sys.stderr)
        sys.exit(1)

    config = load_config(args.config)
    desc = config.get("description", "")
    if desc:
        print(f"{desc}\n")

    variables = collect_prompts(config.get("checks", []))
    if variables:
        print()

    print("Running checks...")
    results = run_checks(config, variables)
    failure_count = report(results)
    sys.exit(1 if failure_count else 0)


if __name__ == "__main__":
    main()
