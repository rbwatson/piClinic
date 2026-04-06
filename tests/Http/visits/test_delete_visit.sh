#!/usr/bin/env bash
# OPERATION: deleteVisit
source "$(dirname "$0")/../lib/helpers.sh"

# Create a dedicated visit to delete
setup=$(api_post "/visits" '{
    "clinicPatientID": "00004",
    "visitType":       "Clinic"
}')
if [ "$(http_status "$setup")" != "201" ]; then
    fail "Setup failed: could not create visit for delete test" "$(http_body "$setup")"
fi
visit_id=$(http_body "$setup" | jq -r '.data.patientVisitID')

response=$(api_delete "/visits/${visit_id}")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".status" "success" "$body"

# Confirm the visit no longer appears
check=$(api_get "/visits/${visit_id}")
assert_status 404 "$(http_status "$check")" "$(http_body "$check")"

pass
