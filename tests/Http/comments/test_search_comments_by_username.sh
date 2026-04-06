#!/usr/bin/env bash
# OPERATION: searchComments
source "$(dirname "$0")/../lib/helpers.sh"

# Create a comment first so there is at least one to find
api_post "/comments" '{"username":"TestCS","commentText":"Search target"}' > /dev/null

response=$(api_get "/comments?username=TestCS")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"

# Response must be a non-empty array
count=$(echo "$body" | jq 'length')
if [ "$count" -lt 1 ]; then
    fail "Expected at least 1 comment, got ${count}"
fi

pass
