#!/usr/bin/env bash
# OPERATION: searchLog
source "$(dirname "$0")/../lib/helpers.sh"

# Write an entry with a known class
api_post "/log" "{\"userToken\":\"${TOKEN}\",\"logClass\":\"API\",\"logStatusMessage\":\"search-by-class test\"}" > /dev/null

response=$(api_get "/log?logClass=API")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"

count=$(echo "$body" | jq 'length')
if [ "$count" -lt 1 ]; then
    fail "Expected at least 1 log entry with logClass=API, got ${count}"
fi

pass
