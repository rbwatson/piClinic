#!/usr/bin/env bash
# OPERATION: updateVisit
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_patch "/visits/${TEST_VISIT_ID}" '{
    "primaryComplaint": "Updated complaint",
    "visitStatus":      "Open"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".patientVisitID" "$TEST_VISIT_ID" "$body"
assert_field ".primaryComplaint" "Updated complaint" "$body"

pass
