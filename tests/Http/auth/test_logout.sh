#!/usr/bin/env bash
# OPERATION: logout
source "$(dirname "$0")/../lib/helpers.sh"

# Log in as a separate user so the shared TOKEN remains valid after this test
login_response=$(api_post_anon "/auth/login" \
    "{\"username\":\"TestRO\",\"password\":\"${TEST_STAFF_PASSWORD}\"}")
tmp_token=$(http_body "$login_response" | jq -r '.data.token')

# Logout using the temporary token
original_token="$TOKEN"
TOKEN="$tmp_token"

response=$(api_post "/auth/logout" '{}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_field ".status" "success" "$body"

# Confirm the token is now invalid
check_response=$(api_get "/auth/session")
check_status=$(http_status "$check_response")

TOKEN="$original_token"

assert_status 401 "$check_status" "$(http_body "$check_response")"

pass
