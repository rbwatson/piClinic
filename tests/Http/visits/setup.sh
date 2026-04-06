#!/usr/bin/env bash
# setup.sh - Create a known visit for visit tests.
# Sourced by run_tests.sh before visit tests run.
# Exports TEST_VISIT_ID for use in test files.
source "$(dirname "$0")/../lib/helpers.sh"

echo "[setup] visits: creating test visit..."
response=$(api_post "/visits" '{
    "clinicPatientID": "00002",
    "visitType":       "Clinic",
    "staffUsername":   "TestCS"
}')
if [ "$(http_status "$response")" != "201" ]; then
    echo "ERROR: visits/setup.sh failed to create test visit" >&2
    echo "       Response: $(http_body "$response")" >&2
    exit 1
fi

TEST_VISIT_ID=$(http_body "$response" | jq -r '.data.patientVisitID')
export TEST_VISIT_ID
echo "[setup] visits: test visit created (${TEST_VISIT_ID})"
