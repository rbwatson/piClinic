#!/bin/bash
#
# piclinic_bootstrap.sh
#
# Minimal bootstrap for a fresh piClinic v2 installation.
#
# This script does only what is needed before the main setup script
# can run: installs curl and git (if missing) and clones the piClinic
# repository.
#
# HOW TO USE:
#   Open a terminal on the target machine and paste the following:
#
#       bash <(curl -fsSL https://raw.githubusercontent.com/rbwatson/piClinic/main_v2/tools/piclinic_bootstrap.sh)
#
#   Or, if curl is not yet available, paste the contents of this file
#   directly into a terminal.
#
# WHAT THIS SCRIPT DOES:
#   1. Installs curl and git if they are not already present.
#   2. Clones the piClinic repository (main_v2 branch) to ~/piClinic.
#      If the directory already exists, it pulls the latest changes instead.
#
# WHAT TO DO AFTER THIS SCRIPT COMPLETES:
#   1. Copy the setup configuration example file:
#          cp ~/piClinic/tools/piclinic_setup.conf.example \
#             ~/piClinic/tools/piclinic_setup.conf
#   2. Edit the configuration file and fill in all required values:
#          nano ~/piClinic/tools/piclinic_setup.conf
#   3. Run the appropriate setup script for your platform:
#      For a VirtualBox Ubuntu VM:
#          bash ~/piClinic/tools/piClinicVMSetup.sh 2>&1 | tee ~/piclinic_setup.log
#      For a Raspberry Pi:
#          bash ~/piClinic/tools/piClinicSystemSetup.sh 2>&1 | tee ~/piclinic_setup.log
#
#      The tee command writes output to both the terminal and ~/piclinic_setup.log
#      so you have a record of the installation even if the terminal closes.
#      Run the same command again after each restart -- progress is saved.
#
#*****************************************************************************

set -euo pipefail

REPO_URL="https://github.com/rbwatson/piClinic"
BRANCH="main_v2"
TARGET_DIR="$HOME/piClinic"

echo "=============================================================================="
echo " piClinic v2 Bootstrap"
echo "=============================================================================="
echo ""

# -----------------------------------------------------------------------------
# STEP 1: Install curl and git if missing
# -----------------------------------------------------------------------------

NEED_UPDATE=0

if ! command -v curl &>/dev/null; then
    echo "curl not found -- will install."
    NEED_UPDATE=1
else
    echo "curl is already installed: $(curl --version | head -1)"
fi

if ! command -v git &>/dev/null; then
    echo "git not found -- will install."
    NEED_UPDATE=1
else
    echo "git is already installed: $(git --version)"
fi

if [ "$NEED_UPDATE" -eq 1 ]; then
    sudo apt-get update -q
    command -v curl &>/dev/null || sudo apt-get install -y curl
    command -v git  &>/dev/null || sudo apt-get install -y git
fi

# -----------------------------------------------------------------------------
# STEP 2: Clone or update the repository
# -----------------------------------------------------------------------------

if [ -d "$TARGET_DIR/.git" ]; then
    echo ""
    echo "Repository already present at $TARGET_DIR"
    echo "Pulling latest changes from $BRANCH..."
    cd "$TARGET_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo ""
    echo "Cloning piClinic repository ($BRANCH) to $TARGET_DIR..."
    git clone -b "$BRANCH" "$REPO_URL" "$TARGET_DIR"
fi

# -----------------------------------------------------------------------------
# Done -- print next steps
# -----------------------------------------------------------------------------

echo ""
echo "=============================================================================="
echo " Bootstrap complete."
echo "=============================================================================="
echo ""
echo " Next steps:"
echo ""
echo " 1. Create and edit your installation configuration file:"
echo ""
echo "        cp ~/piClinic/tools/piclinic_setup.conf.example \\"
echo "           ~/piClinic/tools/piclinic_setup.conf"
echo ""
echo "        nano ~/piClinic/tools/piclinic_setup.conf"
echo ""
echo "    Fill in all required values (passwords, timezone, etc.)"
echo "    before running the setup script."
echo ""
echo " 2. Run the setup script for your platform:"
echo ""
echo "    VirtualBox Ubuntu VM:"
echo "        bash ~/piClinic/tools/piClinicVMSetup.sh 2>&1 | tee ~/piclinic_setup.log"
echo ""
echo "    Raspberry Pi:"
echo "        bash ~/piClinic/tools/piClinicSystemSetup.sh 2>&1 | tee ~/piclinic_setup.log"
echo ""
echo "    The tee command writes output to both the terminal and ~/piclinic_setup.log"
echo "    so you have a record of the installation even if the terminal closes."
echo "    Run the same command again after each restart -- progress is saved."
echo ""
