#!/usr/bin/env bash
# OPERATION: listStaff
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/staff")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_array_not_empty "." "$body"

pass
