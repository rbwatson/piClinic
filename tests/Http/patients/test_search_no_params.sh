#!/usr/bin/env bash
# OPERATION: searchPatients
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/patients")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 400 "$status" "$body"
assert_field ".status" "error" "$body"

pass
