#!/usr/bin/env bash
# OPERATION: createComment
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/comments" '{
    "commentText": "No username provided"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 400 "$status" "$body"

pass
