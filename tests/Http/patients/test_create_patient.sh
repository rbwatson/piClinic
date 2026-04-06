#!/usr/bin/env bash
# OPERATION: createPatient
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/patients" '{
    "clinicPatientID": "HTTP-TEST-001",
    "lastName":        "HTTPTest",
    "firstName":       "Create",
    "sex":             "F",
    "birthDate":       "1990-01-01"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 201 "$status" "$body"
assert_field ".status" "success" "$body"
assert_field ".data.clinicPatientID" "HTTP-TEST-001" "$body"
assert_field ".data.lastName" "HTTPTest" "$body"

pass
