#!/usr/bin/env bash
# OPERATION: listStaff
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/staff?position=Nurse")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_array_not_empty "." "$body"

# Confirm every returned member has the expected position
count=$(http_body "$response" | jq '[.[] | select(.position != "Nurse")] | length')
if [ "$count" -ne 0 ]; then
    fail "listStaff returned non-Nurse staff when filtering by position=Nurse" "$body"
fi

pass
