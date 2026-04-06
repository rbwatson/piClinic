#!/usr/bin/env bash
# OPERATION: searchLog
source "$(dirname "$0")/../lib/helpers.sh"

today=$(date +%Y-%m-%d)

# Write an entry so today will have at least one result
api_post "/log" "{\"userToken\":\"${TOKEN}\",\"logClass\":\"API\",\"logStatusMessage\":\"search-by-date test\"}" > /dev/null

response=$(api_get "/log?logDate=${today}")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"

count=$(echo "$body" | jq 'length')
if [ "$count" -lt 1 ]; then
    fail "Expected at least 1 log entry for today, got ${count}"
fi

pass
