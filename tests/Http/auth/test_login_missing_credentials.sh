#!/usr/bin/env bash
# OPERATION: login
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post_anon "/auth/login" \
    '{"username":"","password":""}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 400 "$status" "$body"
assert_field ".status" "error" "$body"

pass
