#!/usr/bin/env bash
# OPERATION: getPatient
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/patients/00001")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".clinicPatientID" "00001" "$body"
assert_field ".lastName" "Fernández" "$body"
assert_field ".firstName" "Yamel" "$body"
assert_field ".sex" "F" "$body"

pass
