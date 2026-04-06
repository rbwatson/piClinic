#!/usr/bin/env bash
# OPERATION: getVisit
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/visits/000000000000000000000000")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 404 "$status" "$body"
assert_field ".status" "error" "$body"

pass
