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
#
# What this script installs:
#   - @tailwindcss/vite         Tailwind v4 Vite plugin (required for npm build)
#   - @types/node               TypeScript types for Node.js (required for vite.config.ts)
#   - mysql-connector-python    Python MySQL driver for generate_test_visits.py
#   - openapi-typescript        CLI tool to generate TypeScript types from openapi.yaml
#   - Playwright browsers       For future E2E testing (Playwright is already in package.json)
#   - Vale                      Prose linter used in the docs workflow
#   - VS Code (optional)        Skipped if --no-vscode flag is passed
#
# Usage:
#   bash ~/piClinic/tools/install-piclinic-dev-tools.sh
#   bash ~/piClinic/tools/install-piclinic-dev-tools.sh --no-vscode
#
# Safe to rerun: all steps are idempotent.
#
#*****************************************************************************

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../frontend" && pwd)"
INSTALL_VSCODE=true

# Parse flags
for arg in "$@"; do
    case "$arg" in
        --no-vscode) INSTALL_VSCODE=false ;;
        *)
            echo "Unknown argument: $arg"
            echo "Usage: $0 [--no-vscode]"
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
# Pre-flight: verify prerequisites
# =============================================================================

echo "Checking prerequisites..."

if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "       Run piClinicVMSetup.sh first to install Node.js."
    exit 1
fi
NODE_VER=$(node -v)
echo "  [ok] Node.js $NODE_VER"

if ! command -v npm &>/dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi
NPM_VER=$(npm -v)
echo "  [ok] npm $NPM_VER"

if ! command -v python3 &>/dev/null; then
    echo "ERROR: Python 3 is not installed."
    echo "       Run piClinicVMSetup.sh first."
    exit 1
fi
PY_VER=$(python3 --version)
echo "  [ok] $PY_VER"

if ! command -v pip3 &>/dev/null; then
    echo "  pip3 not found -- installing..."
    sudo apt-get install -y python3-pip
fi
echo "  [ok] pip3 $(pip3 --version | awk '{print $2}')"

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "ERROR: frontend/package.json not found at $FRONTEND_DIR"
    echo "       Make sure the piClinic repo is cloned and you are on the correct branch."
    exit 1
fi
echo "  [ok] frontend/package.json found"

echo ""

# =============================================================================
# Step 1: npm install (install all frontend dependencies from package-lock.json)
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
# Step 3: @types/node (required for path alias in vite.config.ts)
# =============================================================================

echo "--- Step 3: @types/node ---"
cd "$FRONTEND_DIR"
if npm list @types/node --depth=0 2>/dev/null | grep -q '@types/node'; then
    echo "  [ok] @types/node already installed"
else
    npm install --save-dev @types/node
    echo "  [ok] @types/node installed"
fi
echo ""

# =============================================================================
# Step 4: openapi-typescript (generates TypeScript types from openapi.yaml)
# =============================================================================

echo "--- Step 4: openapi-typescript ---"
if npm list -g openapi-typescript 2>/dev/null | grep -q 'openapi-typescript'; then
    echo "  [ok] openapi-typescript already installed globally"
else
    sudo npm install -g openapi-typescript
    echo "  [ok] openapi-typescript installed globally"
fi
echo ""

# =============================================================================
# Step 5: mysql-connector-python (for generate_test_visits.py)
# =============================================================================

echo "--- Step 5: mysql-connector-python ---"
if python3 -c "import mysql.connector" 2>/dev/null; then
    echo "  [ok] mysql-connector-python already installed"
else
    pip3 install mysql-connector-python --break-system-packages
    echo "  [ok] mysql-connector-python installed"
fi
echo ""

# =============================================================================
# Step 6: Playwright browsers (for future E2E tests)
# =============================================================================

echo "--- Step 6: Playwright browsers ---"
cd "$FRONTEND_DIR"
# Install only Chromium to save space -- sufficient for Pi/Ubuntu testing
if npx playwright install chromium --with-deps 2>/dev/null; then
    echo "  [ok] Playwright Chromium installed"
else
    echo "  [warn] Playwright browser install failed (non-fatal -- E2E tests only)"
fi
echo ""

# =============================================================================
# Step 7: Vale prose linter
# =============================================================================

echo "--- Step 7: Vale prose linter ---"
if command -v vale &>/dev/null; then
    echo "  [ok] Vale $(vale --version) already installed"
else
    # Install via snap if available, otherwise download binary
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
# Step 8: VS Code (optional)
# =============================================================================

if [ "$INSTALL_VSCODE" = true ]; then
    echo "--- Step 8: VS Code ---"
    if command -v code &>/dev/null; then
        echo "  [ok] VS Code $(code --version | head -1) already installed"
    else
        # Use the official Microsoft repo for a stable release
        curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
            | gpg --dearmor \
            | sudo tee /usr/share/keyrings/microsoft-archive-keyring.gpg > /dev/null
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-archive-keyring.gpg] \
https://packages.microsoft.com/repos/vscode stable main" \
            | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y code
        echo "  [ok] VS Code installed"
    fi
    echo ""
else
    echo "--- Step 8: VS Code (skipped via --no-vscode) ---"
    echo ""
fi

# =============================================================================
# Step 9: Verify the frontend build works
# =============================================================================

echo "--- Step 9: Verify frontend build ---"
cd "$FRONTEND_DIR"
if npm run build 2>&1 | tail -5; then
    echo "  [ok] npm run build succeeded"
else
    echo ""
    echo "  [WARN] npm run build failed. Review the output above."
    echo "         This may be a configuration issue unrelated to this script."
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
echo "   Frontend tests:         cd ~/piClinic/frontend && npm test"
echo "   Generate API types:     cd ~/piClinic/frontend && npx openapi-typescript \\"
echo "                               ~/piClinic/www_v2/html/api/docs/openapi.yaml \\"
echo "                               --output src/api/types.ts"
echo "   Generate test visits:   cd ~/piClinic && python3 tools/generate_test_visits.py"
echo "   Lint prose:             vale <file>"
echo ""
echo " The dev server proxies /api to http://localhost:80."
echo " Make sure the piClinic v2 backend is deployed before testing API calls:"
echo "   bash ~/piClinic/tools/deploy.sh v2"
echo ""
