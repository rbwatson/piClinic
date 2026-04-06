#!/usr/bin/env bash
# OPERATION: searchClinics
source "$(dirname "$0")/../lib/helpers.sh"

# Search for this clinic using the default clinicID = 1
response=$(api_get "/clinics?clinicID=1")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_array_not_empty ".data" "$body"

pass
