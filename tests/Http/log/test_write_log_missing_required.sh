#!/usr/bin/env bash
# OPERATION: writeLogEntry
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/log" "{
    \"userToken\": \"${TOKEN}\"
}")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 400 "$status" "$body"

pass
