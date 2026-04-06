#!/usr/bin/env bash
# OPERATION: deleteStaffMember
source "$(dirname "$0")/../lib/helpers.sh"

# Create a dedicated staff member to delete
setup=$(api_post "/staff" '{
    "username":      "http-del-staff",
    "password":      "TestPassword1!",
    "lastName":      "HTTPDel",
    "firstName":     "Staff",
    "position":      "ClinicStaff",
    "accessGranted": "ClinicStaff"
}')
if [ "$(http_status "$setup")" != "201" ]; then
    fail "Setup failed: could not create staff member for delete test" "$(http_body "$setup")"
fi

response=$(api_delete "/staff/http-del-staff")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".status" "success" "$body"

# Confirm the staff member no longer exists
check=$(api_get "/staff/http-del-staff")
assert_status 404 "$(http_status "$check")" "$(http_body "$check")"

pass
