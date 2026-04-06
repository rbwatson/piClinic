#!/usr/bin/env bash
# OPERATION: updatePatient
source "$(dirname "$0")/../lib/helpers.sh"

# Create a patient to update, so the base data is not modified
setup=$(api_post "/patients" '{
    "clinicPatientID": "HTTP-UPD-001",
    "lastName":        "UpdateTest",
    "firstName":       "Original",
    "sex":             "M"
}')
if [ "$(http_status "$setup")" != "201" ]; then
    fail "Setup failed: could not create patient for update test" "$(http_body "$setup")"
fi

response=$(api_patch "/patients/HTTP-UPD-001" '{
    "firstName": "Updated"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".firstName" "Updated" "$body"
assert_field ".clinicPatientID" "HTTP-UPD-001" "$body"

pass
