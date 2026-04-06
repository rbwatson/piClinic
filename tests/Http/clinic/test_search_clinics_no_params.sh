#!/usr/bin/env bash
# OPERATION: searchClinics
source "$(dirname "$0")/../lib/helpers.sh"

# At least one search parameter is required
response=$(api_get "/clinics")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 400 "$status" "$body"
assert_field ".status" "error" "$body"

pass
