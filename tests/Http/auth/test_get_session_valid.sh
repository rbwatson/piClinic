#!/usr/bin/env bash
# OPERATION: getSession
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/auth/session")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".status" "success" "$body"
assert_field ".data.username" "TestCS" "$body"
assert_field_exists ".data.token" "$body"
assert_field_exists ".data.expiresOnDate" "$body"

pass
