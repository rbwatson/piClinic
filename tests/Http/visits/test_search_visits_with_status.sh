#!/usr/bin/env bash
# OPERATION: searchVisits
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_get "/visits?clinicPatientID=00002&visitStatus=Open")
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 200 "$status" "$body"
assert_array_not_empty "." "$body"

# All returned visits should have status Open
first_status=$(echo "$body" | jq -r '.[0].visitStatus')
assert_field ".[0].visitStatus" "Open" "$body"

pass
