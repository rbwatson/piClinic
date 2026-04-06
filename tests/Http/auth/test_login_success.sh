#!/usr/bin/env bash
# OPERATION: login
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post_anon "/auth/login" \
    "{\"username\":\"TestCS\",\"password\":\"${TEST_STAFF_PASSWORD}\"}")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 201 "$status" "$body"
assert_field ".status" "success" "$body"
assert_field_exists ".data.token" "$body"
assert_field_exists ".data.expiresOnDate" "$body"

pass
