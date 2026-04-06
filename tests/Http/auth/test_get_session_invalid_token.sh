#!/usr/bin/env bash
# OPERATION: getSession
source "$(dirname "$0")/../lib/helpers.sh"

# Override TOKEN with an invalid value for this test only
original_token="$TOKEN"
TOKEN="invalid-token-xyz"

response=$(api_get "/auth/session")
status=$(http_status "$response")
body=$(http_body "$response")

TOKEN="$original_token"

assert_status 401 "$status" "$body"
assert_field ".status" "error" "$body"

pass
