#!/usr/bin/env bash
# OPERATION: searchVisits
source "$(dirname "$0")/../lib/helpers.sh"

# clinicPatientID is required
response=$(api_get "/visits")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 400 "$status" "$body"
assert_field ".status" "error" "$body"

pass
