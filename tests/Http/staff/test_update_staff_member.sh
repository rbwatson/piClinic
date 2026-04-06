#!/usr/bin/env bash
# OPERATION: updateStaffMember
source "$(dirname "$0")/../lib/helpers.sh"

# Create a dedicated staff member to update
setup=$(api_post "/staff" '{
    "username":   "http-upd-staff",
    "password":   "TestPassword1!",
    "nameFamily": "HTTPUpd",
    "nameGiven":  "Staff",
    "position":   "ClinicalStaff"
}')
if [ "$(http_status "$setup")" != "201" ]; then
    fail "Setup failed: could not create staff member for update test" "$(http_body "$setup")"
fi

response=$(api_patch "/staff/http-upd-staff" '{
    "nameGiven": "Updated"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".username" "http-upd-staff" "$body"
assert_field ".nameGiven" "Updated" "$body"

pass
