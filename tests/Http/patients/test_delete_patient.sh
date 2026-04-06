#!/usr/bin/env bash
# OPERATION: deletePatient
source "$(dirname "$0")/../lib/helpers.sh"

# Create a patient to delete
setup=$(api_post "/patients" '{
    "clinicPatientID": "HTTP-DEL-001",
    "lastName":        "DeleteTest",
    "firstName":       "ToDelete",
    "sex":             "F"
}')
if [ "$(http_status "$setup")" != "201" ]; then
    fail "Setup failed: could not create patient for delete test" "$(http_body "$setup")"
fi

response=$(api_delete "/patients/HTTP-DEL-001")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".status" "success" "$body"

# Confirm the patient no longer appears in search results
check=$(api_get "/patients/HTTP-DEL-001")
assert_status 404 "$(http_status "$check")" "$(http_body "$check")"

pass
