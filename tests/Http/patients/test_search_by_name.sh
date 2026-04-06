#!/usr/bin/env bash
# OPERATION: searchPatients
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/patients?lastName=Fern%C3%A1ndez")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_array_not_empty "." "$body"

pass
