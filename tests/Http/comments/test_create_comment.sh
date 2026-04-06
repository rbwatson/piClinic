#!/usr/bin/env bash
# OPERATION: createComment
source "$(dirname "$0")/../lib/helpers.sh"

response=$(api_post "/comments" '{
    "username":    "TestCS",
    "commentText": "HTTP test comment"
}')
status=$(http_status "$response")
body=$(http_body "$response")

assert_status 201 "$status" "$body"
assert_field ".status" "success" "$body"
assert_field ".data.username" "TestCS" "$body"
assert_field ".data.commentText" "HTTP test comment" "$body"

pass
