#!/usr/bin/env bash
# OPERATION: createVisit
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/visits" '{
    "clinicPatientID": "00003",
    "visitType":       "Clinic",
    "staffUsername":   "TestCS",
    "primaryComplaint": "HTTP test visit"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 201 "$status" "$body"
assert_field ".status" "success" "$body"
assert_field ".data.clinicPatientID" "00003" "$body"
assert_field ".data.visitStatus" "Open" "$body"
assert_field_exists ".data.patientVisitID" "$body"

pass
