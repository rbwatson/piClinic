#!/usr/bin/env bash
# helpers.sh - Shared functions for piClinic HTTP integration tests
#
# Usage: source this file from each test script.
# Requires: curl, jq
#
# Environment variables (set by run_tests.sh):
#   BASE_URL            API base URL (e.g. http://localhost)
#   TOKEN               Session token from login (set after prerequisite login)
#   TEST_STAFF_PASSWORD Plain-text password for test staff accounts in TestUsers.sql

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

# Execute a curl request and return "BODY\nHTTPSTATUS:NNN"
# Used internally by api_* functions.
_curl() {
    curl -s -w "\nHTTPSTATUS:%{http_code}" "$@"
}

# Extract the HTTP status code from a _curl response.
http_status() {
    echo "$1" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2
}

# Extract the response body from a _curl response.
http_body() {
    echo "$1" | sed 's/HTTPSTATUS:[0-9]*$//' | sed '/^$/d'
}

# GET /api/v2/<path> with session token.
api_get() {
    local path="$1"
    _curl -X GET \
        -H "X-Session-Token: ${TOKEN}" \
        -H "Accept: application/json" \
        "${BASE_URL}/api/v2${path}"
}

# POST /api/v2/<path> with session token.
api_post() {
    local path="$1"
    local body="$2"
    _curl -X POST \
        -H "X-Session-Token: ${TOKEN}" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$body" \
        "${BASE_URL}/api/v2${path}"
}

# POST /api/v2/<path> WITHOUT session token (used for login).
api_post_anon() {
    local path="$1"
    local body="$2"
    _curl -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$body" \
        "${BASE_URL}/api/v2${path}"
}

# PATCH /api/v2/<path> with session token.
api_patch() {
    local path="$1"
    local body="$2"
    _curl -X PATCH \
        -H "X-Session-Token: ${TOKEN}" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$body" \
        "${BASE_URL}/api/v2${path}"
}

# DELETE /api/v2/<path> with session token.
api_delete() {
    local path="$1"
    _curl -X DELETE \
        -H "X-Session-Token: ${TOKEN}" \
        -H "Accept: application/json" \
        "${BASE_URL}/api/v2${path}"
}

# ---------------------------------------------------------------------------
# Assertion helpers
# Each calls fail on mismatch; the test exits 1 immediately on first failure.
# ---------------------------------------------------------------------------

# Assert the HTTP status code matches expected.
assert_status() {
    local expected="$1"
    local actual="$2"
    local body="$3"
    if [ "$actual" != "$expected" ]; then
        fail "Expected HTTP $expected, got HTTP $actual" "$body"
    fi
}

# Assert a jq path in the response body equals an expected value.
assert_field() {
    local jq_path="$1"
    local expected="$2"
    local body="$3"
    local actual
    actual=$(echo "$body" | jq -r "$jq_path" 2>/dev/null)
    if [ "$actual" != "$expected" ]; then
        fail "Expected $jq_path = '$expected', got '$actual'" "$body"
    fi
}

# Assert a jq path exists and is not null/empty in the response body.
assert_field_exists() {
    local jq_path="$1"
    local body="$2"
    local actual
    actual=$(echo "$body" | jq -r "$jq_path" 2>/dev/null)
    if [ -z "$actual" ] || [ "$actual" = "null" ]; then
        fail "Expected $jq_path to exist and be non-null" "$body"
    fi
}

# Assert a jq array path has at least one element.
assert_array_not_empty() {
    local jq_path="$1"
    local body="$2"
    local count
    count=$(echo "$body" | jq -r "${jq_path} | length" 2>/dev/null)
    if [ -z "$count" ] || [ "$count" -eq 0 ] 2>/dev/null; then
        fail "Expected $jq_path to be a non-empty array" "$body"
    fi
}

# ---------------------------------------------------------------------------
# Pass / fail reporting
# ---------------------------------------------------------------------------

# Derive the test name from the calling script's filename.
_test_name() {
    local script
    script=$(basename "$0" .sh)
    local dir
    dir=$(basename "$(dirname "$0")")
    echo "${dir}/${script}"
}

# Print PASS and exit 0.
pass() {
    printf "PASS  %s\n" "$(_test_name)"
    exit 0
}

# Print FAIL with the response body and exit 1.
fail() {
    local message="${1:-}"
    local body="${2:-}"
    printf "FAIL  %s\n" "$(_test_name)"
    if [ -n "$message" ]; then
        printf "      %s\n" "$message"
    fi
    if [ -n "$body" ]; then
        printf "      Response: %s\n" "$body"
    fi
    exit 1
}
