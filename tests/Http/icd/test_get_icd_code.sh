#!/usr/bin/env bash
# OPERATION: getIcdCode
source "$(dirname "$0")/../lib/helpers.sh"

# A00.1 is present in the base ICD-10 data loaded by db_reset
response=$(api_get "/icd/A00.1")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".icd10code" "A00.1" "$body"

pass
