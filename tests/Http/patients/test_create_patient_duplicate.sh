#!/usr/bin/env bash
# OPERATION: createPatient
source "$(dirname "$0")/../lib/helpers.sh"

# 00001 already exists in the base test data
response=$(api_post "/patients" '{
    "clinicPatientID": "00001",
    "lastName":        "Duplicate",
    "firstName":       "Test",
    "sex":             "M"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 409 "$status" "$body"
assert_field ".status" "error" "$body"

pass
