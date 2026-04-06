#!/usr/bin/env bash
# OPERATION: getStaffMember
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/staff/NOTEXIST")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 404 "$status" "$body"
assert_field ".status" "error" "$body"

pass
