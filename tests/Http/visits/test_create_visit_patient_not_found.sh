#!/usr/bin/env bash
# OPERATION: createVisit
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/visits" '{
    "clinicPatientID": "NOTEXIST",
    "visitType":       "Clinic"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 404 "$status" "$body"
assert_field ".status" "error" "$body"

pass
