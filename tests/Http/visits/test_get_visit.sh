#!/usr/bin/env bash
# OPERATION: getVisit
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/visits/${TEST_VISIT_ID}")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".patientVisitID" "$TEST_VISIT_ID" "$body"
assert_field ".clinicPatientID" "00002" "$body"
assert_field ".visitStatus" "Open" "$body"

pass
