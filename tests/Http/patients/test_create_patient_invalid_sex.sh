#!/usr/bin/env bash
# OPERATION: createPatient
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/patients" '{
    "clinicPatientID": "HTTP-TEST-BAD",
    "lastName":        "HTTPTest",
    "firstName":       "BadSex",
    "sex":             "Z"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 400 "$status" "$body"
assert_field ".status" "error" "$body"

pass
