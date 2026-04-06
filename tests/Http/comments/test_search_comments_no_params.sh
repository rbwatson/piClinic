#!/usr/bin/env bash
# OPERATION: searchComments
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/comments")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"

# Response must be an array (may be empty if no comments exist)
type=$(echo "$body" | jq -r 'type')
if [ "$type" != "array" ]; then
    fail "Expected array response, got ${type}"
fi

pass
