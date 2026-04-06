#!/usr/bin/env bash
# OPERATION: writeLogEntry
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/log" "{
    \"userToken\":        \"${TOKEN}\",
    \"logClass\":         \"API\",
    \"sourceModule\":     \"http-test\",
    \"logStatusMessage\": \"HTTP test log entry\"
}")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 201 "$status" "$body"
assert_field ".status" "success" "$body"
assert_field ".data.logClass" "API" "$body"
assert_field ".data.logStatusMessage" "HTTP test log entry" "$body"

pass
