#!/usr/bin/env bash
# OPERATION: getStaffMember
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/staff/TestCS")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".username" "TestCS" "$body"
assert_field ".position" "ClinicalStaff" "$body"

pass
