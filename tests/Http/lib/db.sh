#!/usr/bin/env bash
# db.sh - Database helpers for piClinic HTTP integration tests
#
# Usage: source this file from run_tests.sh or setup.sh scripts.
#
# Reads database credentials from ENV_FILE (default: /var/www/html/api/.env).
# Requires: mysql client

ENV_FILE="${ENV_FILE:-/var/www/html/api/.env}"

# ---------------------------------------------------------------------------
# Parse .env for database credentials
# ---------------------------------------------------------------------------
_db_load_credentials() {
    if [ ! -f "$ENV_FILE" ]; then
        echo "ERROR: .env file not found at ${ENV_FILE}" >&2
        echo "       Set ENV_FILE to the correct path and retry." >&2
        exit 1
    fi

    DB_HOST=$(grep -E '^DB_HOST=' "$ENV_FILE"     | cut -d= -f2 | tr -d '"')
    DB_USER=$(grep -E '^DB_USER=' "$ENV_FILE"     | cut -d= -f2 | tr -d '"')
    DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2 | tr -d '"')
    DB_NAME=$(grep -E '^DB_NAME=' "$ENV_FILE"     | cut -d= -f2 | tr -d '"')

    DB_HOST="${DB_HOST:-localhost}"
    DB_NAME="${DB_NAME:-piclinic}"

    export DB_HOST DB_USER DB_PASSWORD DB_NAME
}

# Internal: run a mysql command with loaded credentials.
_mysql() {
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" "$@"
}

# ---------------------------------------------------------------------------
# Connectivity check
# ---------------------------------------------------------------------------
db_check() {
    _db_load_credentials
    if ! _mysql -e "SELECT 1;" > /dev/null 2>&1; then
        echo "ERROR: Cannot connect to database ${DB_NAME}@${DB_HOST} as ${DB_USER}" >&2
        return 1
    fi
}

# ---------------------------------------------------------------------------
# Reset database to known test state
# Clears sessions, visits, and test staff, then reloads base SQL files.
# ---------------------------------------------------------------------------
db_reset() {
    _db_load_credentials

    local sql_dir="${SQL_DIR:-}"
    if [ -z "$sql_dir" ]; then
        # Derive from this file's location: tests/Http/lib/ -> ../../.. -> repo root -> sql/
        sql_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)/sql"
    fi

    echo "[db] Resetting database to known test state..."

    # Clear transient data
    _mysql -e "TRUNCATE TABLE session;" 2>/dev/null || true
    _mysql -e "DELETE FROM visit;"      2>/dev/null || true

    # Remove any staff created during previous test runs (non-base users).
    # Base test usernames are the ones inserted by TestUsers.sql.
    _mysql -e "DELETE FROM staff WHERE username NOT IN (
        'Alaniz','García','Saavedra','Najera','Verduzco','Griego',
        'Corral','Agosto','Valadez','MedicalStudent','NursingStudent',
        'TestSA','TestCA','TestCS','TestRO'
    );" 2>/dev/null || true

    # Reload base test data
    _mysql < "${sql_dir}/100PatientsNum.sql" \
        || { echo "ERROR: Failed to load 100PatientsNum.sql" >&2; exit 1; }
    _mysql < "${sql_dir}/TestUsers.sql" \
        || { echo "ERROR: Failed to load TestUsers.sql" >&2; exit 1; }

    echo "[db] Reset complete."
}

# ---------------------------------------------------------------------------
# Run an arbitrary SQL statement
# ---------------------------------------------------------------------------
db_exec() {
    _db_load_credentials
    _mysql -e "$1"
}

# ---------------------------------------------------------------------------
# Load a fixture file from tests/Http/fixtures/
# ---------------------------------------------------------------------------
db_load() {
    _db_load_credentials
    local fixture_file
    fixture_file="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/fixtures/${1}"
    if [ ! -f "$fixture_file" ]; then
        echo "ERROR: Fixture file not found: ${fixture_file}" >&2
        exit 1
    fi
    _mysql < "$fixture_file"
}
