#!/bin/bash
#
# piclinic_bootstrap.sh
#
# Minimal bootstrap for a fresh piClinic v2 installation.
#
# This script does only what is needed before the main setup script
# can run: installs git (if missing) and clones the piClinic repository.
#
# HOW TO USE:
#   Open a terminal on the target machine and paste the following:
#
#       bash <(curl -fsSL https://raw.githubusercontent.com/rbwatson/piClinic/main_v2/tools/piclinic_bootstrap.sh)
#
#   Or, if you prefer not to pipe from the internet:
#       1. Copy and paste the contents of this file into a terminal.
#
# WHAT THIS SCRIPT DOES:
#   1. Installs git if it is not already present.
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
#          bash ~/piClinic/tools/piClinicVMSetup.sh
#      For a Raspberry Pi:
#          bash ~/piClinic/tools/piClinicSystemSetup.sh
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
# STEP 1: Install git if missing
# -----------------------------------------------------------------------------

if ! command -v git &>/dev/null; then
    echo "git not found -- installing..."
    sudo apt-get update -q
    sudo apt-get install -y git
else
    echo "git is already installed: $(git --version)"
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
echo "        bash ~/piClinic/tools/piClinicVMSetup.sh"
echo ""
echo "    Raspberry Pi:"
echo "        bash ~/piClinic/tools/piClinicSystemSetup.sh"
echo ""
echo "    The setup script will restart the system once after the initial"
echo "    upgrade. After the restart, run the same command again to continue."
echo "    Progress is saved automatically -- completed steps are not repeated."
echo ""
