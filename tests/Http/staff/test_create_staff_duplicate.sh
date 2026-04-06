#!/usr/bin/env bash
# OPERATION: createStaffMember
source "$(dirname "$0")/../lib/helpers.sh"

# TestCS is a base staff member that always exists after db_reset
response=$(api_post "/staff" '{
    "username":   "TestCS",
    "password":   "TestPassword1!",
    "nameFamily": "Duplicate",
    "nameGiven":  "Attempt",
    "position":   "ClinicalStaff"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 409 "$status" "$body"
assert_field ".status" "error" "$body"

pass
