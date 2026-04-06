#!/usr/bin/env bash
# OPERATION: searchClinics
source "$(dirname "$0")/../lib/helpers.sh"

# Search by publicID — test DB clinic publicID 205 is set as ThisClinic
response=$(api_get "/clinic?publicID=205")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_array_not_empty ".data" "$body"

pass
