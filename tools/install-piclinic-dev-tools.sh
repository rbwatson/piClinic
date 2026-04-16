#!/bin/bash
#
# install-piclinic-dev-tools.sh
#
# Installs development tools needed to build and test the piClinic v2
# React frontend. These are NOT installed by piClinicVMSetup.sh or
# piClinicSystemSetup.sh because they are not required to run piClinic
# in production -- only to develop and build it.
#
# Prerequisites:
#   - piClinicVMSetup.sh (or piClinicSystemSetup.sh) must have completed
#     successfully. This script requires Node.js, npm, and Python 3 to
#     already be installed.
#   - The piClinic database must be present (required for E2E setup).
#
# What this script installs:
#   - @tailwindcss/vite         Tailwind v4 Vite plugin (required for npm build)
#   - @types/node               TypeScript types for Node.js (required for vite.config.ts)
#   - mysql2                    Node.js MySQL driver (required for E2E DB verification)
#   - mysql-connector-python    Python MySQL driver for generate_test_visits.py
#   - openapi-typescript        CLI tool to generate TypeScript types from openapi.yaml
#   - Playwright browsers       Chromium for E2E tests
#   - Vale                      Prose linter used in the docs workflow
#   - VS Code (optional)        Skipped if --no-vscode flag is passed
#
# E2E test setup (skipped with --skip-e2e):
#   - Creates the piclinic_e2e MariaDB account (SELECT + DELETE on piclinic.*)
#   - Creates the e2e_testuser piClinic application account
#   - Copies frontend/e2e/.env.e2e.example to frontend/e2e/.env.e2e
#     (you must fill in passwords before running E2E tests)
#
# Usage:
#   bash ~/piClinic/tools/install-piclinic-dev-tools.sh
#   bash ~/piClinic/tools/install-piclinic-dev-tools.sh --no-vscode
#   bash ~/piClinic/tools/install-piclinic-dev-tools.sh --skip-e2e
#   bash ~/piClinic/tools/install-piclinic-dev-tools.sh --no-vscode --skip-e2e
#
# Safe to rerun: all steps are idempotent.
#
#*****************************************************************************

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
INSTALL_VSCODE=true
SETUP_E2E=true

# Parse flags
for arg in "$@"; do
    case "$arg" in
        --no-vscode) INSTALL_VSCODE=false ;;
        --skip-e2e)  SETUP_E2E=false ;;
        *)
            echo "Unknown argument: $arg"
            echo "Usage: $0 [--no-vscode] [--skip-e2e]"
            exit 1
            ;;
    esac
done

echo ""
echo "=============================================================================="
echo " piClinic v2 Developer Tools Installer"
echo "=============================================================================="
echo ""

# =============================================================================
# apt lock helper
# =============================================================================

wait_for_apt() {
    local LOCK_FILE="/var/lib/dpkg/lock-frontend"
    local MAX_WAIT=300
    local WAITED=0
    local INTERVAL=5

    if ! sudo fuser "$LOCK_FILE" &>/dev/null 2>&1; then
        return 0
    fi

    echo "  apt lock is held by another process (likely unattended-upgrades)."
    echo "  Waiting up to ${MAX_WAIT}s for it to release..."

    while sudo fuser "$LOCK_FILE" &>/dev/null 2>&1; do
        if [ "$WAITED" -ge "$MAX_WAIT" ]; then
            echo "ERROR: apt lock was not released after ${MAX_WAIT}s."
            exit 1
        fi
        sleep "$INTERVAL"
        WAITED=$(( WAITED + INTERVAL ))
        echo "  ...still waiting (${WAITED}s elapsed)"
    done

    echo "  apt lock released after ${WAITED}s."
}

apt_get() {
    wait_for_apt
    sudo apt-get "$@"
}

# =============================================================================
# Pre-flight: verify prerequisites
# =============================================================================

echo "Checking prerequisites..."

if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is not installed. Run piClinicVMSetup.sh first."
    exit 1
fi
echo "  [ok] Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi
echo "  [ok] npm $(npm -v)"

if ! command -v python3 &>/dev/null; then
    echo "ERROR: Python 3 is not installed. Run piClinicVMSetup.sh first."
    exit 1
fi
echo "  [ok] $(python3 --version)"

if ! command -v pip3 &>/dev/null; then
    echo "  pip3 not found -- installing..."
    apt_get install -y python3-pip
fi
echo "  [ok] pip3 $(pip3 --version | awk '{print $2}')"

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "ERROR: frontend/package.json not found at $FRONTEND_DIR"
    exit 1
fi
echo "  [ok] frontend/package.json found"

echo ""

# =============================================================================
# Step 1: npm install
# =============================================================================

echo "--- Step 1: Install frontend npm dependencies ---"
cd "$FRONTEND_DIR"
npm ci
echo "  [ok] npm ci complete"
echo ""

# =============================================================================
# Step 2: Tailwind Vite plugin
# =============================================================================

echo "--- Step 2: @tailwindcss/vite ---"
cd "$FRONTEND_DIR"
if npm list @tailwindcss/vite --depth=0 2>/dev/null | grep -q '@tailwindcss/vite'; then
    echo "  [ok] @tailwindcss/vite already installed"
else
    npm install --save-dev @tailwindcss/vite
    echo "  [ok] @tailwindcss/vite installed"
fi
echo ""

# =============================================================================
# Step 3: jsdom
# =============================================================================

echo "--- Step 3: jsdom ---"
cd "$FRONTEND_DIR"
if npm list jsdom --depth=0 2>/dev/null | grep -q 'jsdom'; then
    echo "  [ok] jsdom already installed"
else
    npm install --save-dev jsdom
    echo "  [ok] jsdom installed"
fi
echo ""

# =============================================================================
# Step 4: @types/node
# =============================================================================

echo "--- Step 4: @types/node ---"
cd "$FRONTEND_DIR"
if npm list @types/node --depth=0 2>/dev/null | grep -q '@types/node'; then
    echo "  [ok] @types/node already installed"
else
    npm install --save-dev @types/node
    echo "  [ok] @types/node installed"
fi
echo ""

# =============================================================================
# Step 5: openapi-typescript
# =============================================================================

echo "--- Step 5: openapi-typescript ---"
if npm list -g openapi-typescript 2>/dev/null | grep -q 'openapi-typescript'; then
    echo "  [ok] openapi-typescript already installed globally"
else
    sudo npm install -g openapi-typescript
    echo "  [ok] openapi-typescript installed globally"
fi
echo ""

# =============================================================================
# Step 6: mysql-connector-python
# =============================================================================

echo "--- Step 6: mysql-connector-python ---"
if python3 -c "import mysql.connector" 2>/dev/null; then
    echo "  [ok] mysql-connector-python already installed"
else
    pip3 install mysql-connector-python --break-system-packages
    echo "  [ok] mysql-connector-python installed"
fi
echo ""

# =============================================================================
# Step 7: mysql2 (Node.js MySQL driver for E2E tests)
# =============================================================================

echo "--- Step 7: mysql2 (E2E DB driver) ---"
cd "$FRONTEND_DIR"
if npm list mysql2 --depth=0 2>/dev/null | grep -q 'mysql2'; then
    echo "  [ok] mysql2 already installed"
else
    npm install --save-dev mysql2
    echo "  [ok] mysql2 installed"
fi
echo ""

# =============================================================================
# Step 8: Playwright browsers
# =============================================================================

echo "--- Step 8: Playwright browsers ---"
cd "$FRONTEND_DIR"
if npx playwright install chromium --with-deps 2>/dev/null; then
    echo "  [ok] Playwright Chromium installed"
else
    echo "  [warn] Playwright browser install failed (non-fatal -- E2E tests only)"
fi
echo ""

# =============================================================================
# Step 9: E2E test database and application user setup
# =============================================================================

if [ "$SETUP_E2E" = true ]; then
    echo "--- Step 9: E2E test accounts ---"

    E2E_ENV_FILE="$FRONTEND_DIR/e2e/.env.e2e"
    E2E_ENV_EXAMPLE="$FRONTEND_DIR/e2e/.env.e2e.example"
    E2E_SQL="$REPO_ROOT/sql/CreateE2ETestUser.sql"

    # Copy env template if not already present
    if [ -f "$E2E_ENV_FILE" ]; then
        echo "  [ok] $E2E_ENV_FILE already exists -- leaving in place"
    else
        if [ -f "$E2E_ENV_EXAMPLE" ]; then
            cp "$E2E_ENV_EXAMPLE" "$E2E_ENV_FILE"
            echo "  [ok] Created $E2E_ENV_FILE from example"
            echo "  [!!] ACTION REQUIRED: Edit $E2E_ENV_FILE and set real passwords"
            echo "       before running E2E tests."
        else
            echo "  [warn] $E2E_ENV_EXAMPLE not found -- skipping .env.e2e creation"
        fi
    fi

    # Run the SQL setup script if mysql is available
    if command -v mysql &>/dev/null && [ -f "$E2E_SQL" ]; then
        echo ""
        echo "  The E2E SQL setup script needs to run as a MariaDB admin user."
        echo "  It creates the piclinic_e2e DB account and the e2e_testuser app account."
        echo "  You will be prompted for the MariaDB root (or admin) password."
        echo ""
        echo "  Press Enter to run it now, or Ctrl+C to skip and run it manually later:"
        echo "    mysql -u root -p piclinic < $E2E_SQL"
        read -r

        if mysql -u root -p piclinic < "$E2E_SQL"; then
            echo "  [ok] E2E database accounts created"
            echo "  [!!] ACTION REQUIRED: Set real passwords in $E2E_SQL before running --"
            echo "       the script uses placeholder passwords that must be changed."
        else
            echo "  [warn] E2E SQL setup failed -- run it manually:"
            echo "         mysql -u root -p piclinic < $E2E_SQL"
        fi
    else
        echo "  [info] Skipping E2E SQL setup (mysql not found or SQL file missing)."
        echo "         Run manually when ready:"
        echo "           mysql -u root -p piclinic < $E2E_SQL"
    fi

    echo ""
else
    echo "--- Step 9: E2E test accounts (skipped via --skip-e2e) ---"
    echo ""
fi

# =============================================================================
# Step 10: Vale prose linter
# =============================================================================

echo "--- Step 10: Vale prose linter ---"
if command -v vale &>/dev/null; then
    echo "  [ok] Vale $(vale --version) already installed"
else
    if command -v snap &>/dev/null; then
        sudo snap install vale --classic 2>/dev/null && \
            echo "  [ok] Vale installed via snap" || \
            echo "  [warn] snap install failed -- skipping Vale (install manually from https://vale.sh)"
    else
        echo "  [warn] snap not available -- skipping Vale (install manually from https://vale.sh)"
    fi
fi
echo ""

# =============================================================================
# Step 11: VS Code (optional)
# =============================================================================

if [ "$INSTALL_VSCODE" = true ]; then
    echo "--- Step 11: VS Code ---"
    if command -v code &>/dev/null; then
        echo "  [ok] VS Code $(code --version | head -1) already installed"
    else
        curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
            | gpg --dearmor \
            | sudo tee /usr/share/keyrings/microsoft-archive-keyring.gpg > /dev/null
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-archive-keyring.gpg] \
https://packages.microsoft.com/repos/vscode stable main" \
            | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
        apt_get update
        apt_get install -y code
        echo "  [ok] VS Code installed"
    fi
    echo ""
else
    echo "--- Step 11: VS Code (skipped via --no-vscode) ---"
    echo ""
fi

# =============================================================================
# Step 12: Verify the frontend build works
# =============================================================================

echo "--- Step 12: Verify frontend build ---"
cd "$FRONTEND_DIR"
if npm run build 2>&1 | tail -5; then
    echo "  [ok] npm run build succeeded"
else
    echo ""
    echo "  [WARN] npm run build failed. Review the output above."
fi
echo ""

# =============================================================================
# Summary
# =============================================================================

echo "=============================================================================="
echo " Developer tools installation complete."
echo "=============================================================================="
echo ""
echo " Quick reference:"
echo "   Frontend dev server:    cd ~/piClinic/frontend && npm run dev"
echo "   Frontend build:         cd ~/piClinic/frontend && npm run build"
echo "   Frontend unit tests:    cd ~/piClinic/frontend && npm test"
echo "   Frontend E2E tests:     cd ~/piClinic/frontend && npx playwright test"
echo "   Generate API types:     cd ~/piClinic/frontend && npx openapi-typescript \\"
echo "                               ~/piClinic/www_v2/html/api/docs/openapi.yaml \\"
echo "                               --output src/api/types.ts"
echo "   Generate test visits:   cd ~/piClinic && python3 tools/generate_test_visits.py"
echo "   Lint prose:             vale <file>"
echo ""
if [ "$SETUP_E2E" = true ]; then
echo " E2E test setup checklist:"
echo "   1. Edit frontend/e2e/.env.e2e and set real passwords"
echo "   2. Edit sql/CreateE2ETestUser.sql and set real passwords, then rerun:"
echo "        mysql -u root -p piclinic < ~/piClinic/sql/CreateE2ETestUser.sql"
echo "   3. Generate a bcrypt hash for the E2E test user password:"
echo "        php -r \"echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT);\""
echo "   4. Make sure the dev server or deployed app is running at E2E_BASE_URL"
echo "   5. Run: cd ~/piClinic/frontend && npx playwright test"
echo ""
fi
echo " The dev server proxies /api to http://localhost:80."
echo " Make sure the piClinic v2 backend is deployed before testing API calls:"
echo "   bash ~/piClinic/tools/deploy.sh v2"
echo ""
