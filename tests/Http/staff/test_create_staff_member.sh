#!/usr/bin/env bash
# OPERATION: createStaffMember
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/staff" '{
    "username":    "http-test-staff",
    "password":    "TestPassword1!",
    "nameFamily":  "HTTPTest",
    "nameGiven":   "Staff",
    "position":    "ClinicalStaff",
    "medicalStaff": false
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 201 "$status" "$body"
assert_field ".status" "success" "$body"
assert_field ".data.username" "http-test-staff" "$body"
assert_field ".data.position" "ClinicalStaff" "$body"

pass
