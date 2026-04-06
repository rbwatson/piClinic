#!/usr/bin/env bash
# OPERATION: searchIcdCodes
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/icd?q=Cholera")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_array_not_empty ".data" "$body"

pass
