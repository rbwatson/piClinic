#!/bin/bash
#
#   Setup script for a piClinic v2 environment on a Raspberry Pi
#   running Raspberry Pi OS 64-bit with desktop.
#
#   Target: piClinic v2 backend validation on Raspberry Pi 3B+ hardware
#   Host OS: Raspberry Pi OS 64-bit (Bookworm or later)
#   Hardware: Raspberry Pi 3B+ (1 GB RAM)
#
#   OS download: https://www.raspberrypi.com/software/operating-systems/
#       Download: Raspberry Pi OS (64-bit) with desktop
#       (Do NOT use the "with recommended software" image -- extra packages
#        are not needed and waste space on the SD card.)
#   Imager: https://www.raspberrypi.com/software/
#
#   Before running this script:
#   1. Use Raspberry Pi Imager to write the OS to a 32 GB (or larger) microSD card.
#      In the imager advanced options, set:
#           Hostname, username, WiFi credentials, locale, timezone
#   2. Boot the Pi from the microSD card and log in.
#   3. If the Pi has an add-on RTC module, configure it now (see RTC section below)
#      before running this script.
#
#*****************************************************************************
#
#   BEFORE RUNNING THIS SCRIPT:
#     1. Run tools/piclinic_bootstrap.sh to install git and clone the repo.
#     2. Copy tools/piclinic_setup.conf.example to tools/piclinic_setup.conf
#     3. Fill in all values in tools/piclinic_setup.conf
#
#   Then run:
#       bash ~/piClinic/tools/piClinicSystemSetup.sh 2>&1 | tee ~/piclinic_setup.log
#
#   The script saves progress after each step. If a step fails or the system
#   restarts, run the same command again -- completed steps are skipped.
#
#   To check progress without running anything:
#       bash ~/piClinic/tools/piClinicSystemSetup.sh --status
#
#   To start over from the beginning, delete the progress file:
#       rm ~/piClinic/tools/piclinic_setup.progress
#
#*****************************************************************************
#
# -----------------------------------------------------------------------------
# Optional: RTC (Real-Time Clock) configuration
# -----------------------------------------------------------------------------
# If your Pi has an add-on RTC module (e.g., DS1307), configure it before
# running the rest of this script. This is easiest while connected to the
# internet so the clock can be set from NTP on first boot.
#
#   1. Load the RTC module:
#           sudo modprobe rtc-ds1307
#   2. Restart the Pi.
#   3. Add the module to load at boot:
#           sudo nano /etc/modules
#           Add: rtc-ds1307
#   4. Add device initialization to rc.local (before "exit 0"):
#           sudo nano /etc/rc.local
#           Add:
#               echo ds1307 0x68 > /sys/class/i2c-adapter/i2c-1/new_device
#               sudo hwclock -s
#               date
#   5. Restart the Pi and verify the time:
#           sudo hwclock -r
#
#   Reference: https://thepihut.com/blogs/raspberry-pi-tutorials/17209332-adding-a-real-time-clock-to-your-raspberry-pi
#
# -----------------------------------------------------------------------------

echo "PICLINIC: Starting Pi setup script: $(readlink -f "$0")"
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONF_FILE="$SCRIPT_DIR/piclinic_setup.conf"
PROGRESS_FILE="$SCRIPT_DIR/piclinic_setup.progress"
ACTION_REQUIRED_FILE="/tmp/piclinic_action_required.txt"
INSTALL_BRANCH="main_v2"

# =============================================================================
# Progress tracking helpers
# =============================================================================

ALL_STEPS=(
    step1_update
    step2_apache
    step3_php
    step4_php_config
    step5_apache_config
    step6_users
    step7_mariadb
    step8_composer
    step9_nodejs
    step10_phpunit
    step11_clone
    step12_directories
    step13_database
    step14_deploy
    step15_final_update
)

STEP_LABELS=(
    "STEP 1:  System update and base utilities"
    "STEP 2:  Apache web server"
    "STEP 3:  PHP 8.4"
    "STEP 4:  Configure PHP"
    "STEP 5:  Configure Apache"
    "STEP 6:  User accounts and permissions"
    "STEP 7:  MariaDB"
    "STEP 8:  Composer"
    "STEP 9:  Node.js 20 LTS"
    "STEP 10: PHPUnit"
    "STEP 11: Clone piClinic repository"
    "STEP 12: Create application directories"
    "STEP 13: Database setup"
    "STEP 14: Composer update + Deploy v2 API"
    "STEP 15: Final system update"
)

get_last_completed_step() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE"
    else
        echo ""
    fi
}

mark_step_complete() {
    local step="$1"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "PICLINIC: [$timestamp] Marking complete: $step"
    echo "$step" > "$PROGRESS_FILE"
    echo "  [$timestamp] Completed: $step"
}

step_is_done() {
    local step="$1"
    local last
    last=$(get_last_completed_step)
    [ -z "$last" ] && return 1
    local found_step=0
    for s in "${ALL_STEPS[@]}"; do
        if [ "$s" = "$step" ]; then
            found_step=1
        fi
        if [ "$s" = "$last" ]; then
            [ $found_step -eq 1 ] && return 0
            return 1
        fi
    done
    return 1
}

print_status() {
    local last
    last=$(get_last_completed_step)
    echo ""
    echo "piClinic System Setup -- Step Status"
    echo "Progress file: $PROGRESS_FILE"
    echo ""
    local i=0
    for step in "${ALL_STEPS[@]}"; do
        local label="${STEP_LABELS[$i]}"
        if step_is_done "$step" || [ "$step" = "$last" ]; then
            echo "  [done]    $label"
        else
            echo "  [pending] $label"
        fi
        i=$((i + 1))
    done
    echo ""
    if [ -z "$last" ]; then
        echo "  No steps completed yet."
    else
        echo "  Last completed: $last"
    fi
    echo ""
}

# Append a message to the action-required file for display before reboot
queue_action_required() {
    echo "$1" >> "$ACTION_REQUIRED_FILE"
}

# Display any queued action-required messages and require acknowledgment
show_action_required_and_confirm() {
    if [ ! -f "$ACTION_REQUIRED_FILE" ] || [ ! -s "$ACTION_REQUIRED_FILE" ]; then
        return 0
    fi
    echo ""
    echo "=============================================================================="
    echo " ACTION REQUIRED before reboot"
    echo "=============================================================================="
    cat "$ACTION_REQUIRED_FILE"
    echo "=============================================================================="
    echo ""
    read -r -p "Press Enter to confirm you have read the above and continue to reboot... "
    rm -f "$ACTION_REQUIRED_FILE"
}

# Handle --status flag
if [ "${1:-}" = "--status" ]; then
    print_status
    exit 0
fi

# =============================================================================
# Load installation configuration
# =============================================================================
echo "PICLINIC: Reading installation configuration: $(readlink -f "$CONF_FILE")"

if [ ! -f "$CONF_FILE" ]; then
    echo "ERROR: Configuration file not found: $CONF_FILE"
    echo ""
    echo "Before running this script:"
    echo "  1. Run tools/piclinic_bootstrap.sh"
    echo "  2. Copy tools/piclinic_setup.conf.example to tools/piclinic_setup.conf"
    echo "  3. Fill in all values in tools/piclinic_setup.conf"
    exit 1
fi

# shellcheck source=piclinic_setup.conf
source "$CONF_FILE"

REQUIRED_VARS=(INSTALL_BRANCH DB_ADMIN_PASSWORD DB_APP_PASSWORD PICLINIC_SYSADMIN_PASSWORD TIMEZONE)
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR:-}" ]; then
        echo "ERROR: Required variable '$VAR' is not set in $CONF_FILE"
        exit 1
    fi
done

echo "PICLINIC: Configuration loaded from $CONF_FILE"

# =============================================================================
# Pre-flight checks
# =============================================================================

echo ""
echo "PICLINIC: Running pre-flight checks..."

# Internet connectivity — use debian.org which reliably returns 200 for
# unauthenticated requests (raspberrypi.com returns 403 for curl's default UA)
if ! curl -fsS --max-time 10 https://debian.org > /dev/null 2>&1; then
    echo "ERROR: No internet connectivity. Check your network connection and try again."
    exit 1
fi
echo "  [ok] Internet connectivity"

# Disk space (2 GB minimum free)
AVAILABLE_KB=$(df --output=avail / | tail -1)
if [ "$AVAILABLE_KB" -lt 2097152 ]; then
    echo "ERROR: Less than 2 GB of disk space available. Free up space and try again."
    exit 1
fi
echo "  [ok] Disk space ($(( AVAILABLE_KB / 1024 )) MB available)"

# sudo access
if ! sudo -n true 2>/dev/null; then
    sudo true
fi
echo "  [ok] sudo access"

echo ""

LAST=$(get_last_completed_step)
if [ -n "$LAST" ]; then
    echo "Resuming from after: $LAST"
    echo "(To start over, delete $PROGRESS_FILE)"
else
    echo "Starting fresh installation."
fi
echo ""

# Clear any leftover action-required file from a previous run
echo "PICLINIC: removing any leftover action-required file: $ACTION_REQUIRED_FILE"
rm -f "$ACTION_REQUIRED_FILE"

# =============================================================================
# STEP 1: System update and base utilities
# =============================================================================

if ! step_is_done step1_update; then
    echo "PICLINIC: --- STEP 1: System update and base utilities ---"
    sudo apt-get update
    sudo apt-get upgrade -y
    sudo apt-get install -y git net-tools nload curl wget gnupg2 ca-certificates \
        apt-transport-https lsb-release
    sudo apt-get clean
    sudo apt-get autoremove -y
    mark_step_complete step1_update
    echo ""
    echo "STEP 1 complete. The system will now restart."
    echo "After restart, run this script again to continue:"
    echo "    bash ~/piClinic/tools/piClinicSystemSetup.sh 2>&1 | tee ~/piclinic_setup.log"
    echo ""
    sudo shutdown -r now
    exit 0
fi

# =============================================================================
# STEP 2: Apache web server
# =============================================================================

if ! step_is_done step2_apache; then
    echo "PICLINIC: --- STEP 2: Apache web server ---"
    sudo apt-get install -y apache2 apache2-doc
    sudo a2enmod rewrite
    sudo a2enmod headers
    sudo systemctl enable apache2
    sudo systemctl start apache2
    mark_step_complete step2_apache
fi

# =============================================================================
# STEP 3: PHP 8.4
# =============================================================================

if ! step_is_done step3_php; then
    echo "PICLINIC: --- STEP 3: PHP 8.4 ---"
    # Raspberry Pi OS Bookworm ships PHP 8.4 by default. No PPA required.
    sudo apt-get install -y \
        libapache2-mod-php \
        php-common \
        php-fpm \
        php-mysql \
        php-mbstring \
        php-xml \
        php-curl \
        php-zip \
        php-intl \
        php-bcmath
    php -v
    sudo bash -c 'echo "<?php phpinfo(); ?>" > /var/www/html/phpinfo.php'
    sudo chown www-data:www-data /var/www/html/phpinfo.php
    sudo chmod 750 /var/www/html/phpinfo.php
    mark_step_complete step3_php
fi

# =============================================================================
# STEP 4: Configure PHP for development
# =============================================================================

if ! step_is_done step4_php_config; then
    echo "PICLINIC: --- STEP 4: Configure PHP ---"
    PHP_INI=$(php --ini | grep 'Loaded Configuration' | awk '{print $NF}')
    PHP_INI_APACHE=$(echo "$PHP_INI" | sed 's|/cli/|/apache2/|')
    echo "Configuring: $PHP_INI_APACHE"
    sudo sed -i 's/^memory_limit = .*/memory_limit = 512M/' "$PHP_INI_APACHE"
    sudo sed -i "s|^;date.timezone =.*|date.timezone = ${TIMEZONE}|" "$PHP_INI_APACHE"
    sudo sed -i "s|^date.timezone =.*|date.timezone = ${TIMEZONE}|" "$PHP_INI_APACHE"
    sudo sed -i 's/^display_errors = .*/display_errors = On/' "$PHP_INI_APACHE"
    sudo sed -i 's/^display_startup_errors = .*/display_startup_errors = On/' "$PHP_INI_APACHE"
    sudo sed -i 's/^error_reporting = .*/error_reporting = E_ALL/' "$PHP_INI_APACHE"
    sudo systemctl restart apache2
    mark_step_complete step4_php_config
fi

# =============================================================================
# STEP 5: Configure Apache for piClinic
# =============================================================================

if ! step_is_done step5_apache_config; then
    echo "PICLINIC: --- STEP 5: Configure Apache ---"
    sudo sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ {
        s/Options Indexes FollowSymLinks/Options FollowSymLinks/
        s/AllowOverride None/AllowOverride All/
        s/DirectoryIndex .*/DirectoryIndex index.php index.html/
    }' /etc/apache2/apache2.conf
    sudo systemctl restart apache2
    mark_step_complete step5_apache_config
fi

# =============================================================================
# STEP 6: Configure user accounts and permissions
# =============================================================================

if ! step_is_done step6_users; then
    echo "PICLINIC: --- STEP 6: User accounts and permissions ---"
    sudo groupadd --force clinic
    if ! id clinic &>/dev/null; then
        sudo useradd clinic -g clinic
        sudo usermod -a -G audio clinic
        sudo usermod -a -G video clinic
    fi
    sudo mkdir -p /home/clinic
    sudo chown clinic /home/clinic
    if [ -n "${CLINIC_ACCOUNT_PASSWORD:-}" ]; then
        echo "clinic:${CLINIC_ACCOUNT_PASSWORD}" | sudo chpasswd
    fi
    mark_step_complete step6_users
fi

# =============================================================================
# STEP 7: MariaDB
# =============================================================================

if ! step_is_done step7_mariadb; then
    echo "PICLINIC: --- STEP 7: MariaDB ---"
    # Raspberry Pi OS Bookworm ships a current MariaDB release by default.
    sudo apt-get install -y mariadb-server mariadb-client
    sudo systemctl enable mariadb
    sudo systemctl start mariadb
    sudo mariadb -u root <<EOF
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';
-- Remove remote root login
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
-- Create the DBA admin user
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY '${DB_ADMIN_PASSWORD}';
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;
-- The application user account is created later in STEP 13 with the appropriate
-- permissions for the piclinic database.
FLUSH PRIVILEGES;
EOF
    mark_step_complete step7_mariadb
fi

# =============================================================================
# STEP 8: Composer
# =============================================================================

if ! step_is_done step8_composer; then
    echo "PICLINIC: --- STEP 8: Composer ---"
    cd ~
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    HASH="$(curl -sS https://composer.github.io/installer.sig)"
    php -r "if (hash_file('SHA384', 'composer-setup.php') === '${HASH}') { echo 'Installer verified'; } else { echo 'Installer INVALID - aborting'; exit(1); } echo PHP_EOL;"
    sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
    rm composer-setup.php
    composer --version
    mark_step_complete step8_composer
fi

# =============================================================================
# STEP 9: Node.js 20 LTS
# =============================================================================

if ! step_is_done step9_nodejs; then
    echo "PICLINIC: --- STEP 9: Node.js 20 LTS ---"
    cd ~
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    node -v
    npm -v
    mark_step_complete step9_nodejs
fi

# =============================================================================
# STEP 10: PHPUnit
# =============================================================================

if ! step_is_done step10_phpunit; then
    echo "PICLINIC: --- STEP 10: PHPUnit 13 ---"
    # PHPUnit 13.x is required for PHP 8.4.
    sudo wget -O /usr/local/bin/phpunit https://phar.phpunit.de/phpunit-13.phar
    sudo chmod +x /usr/local/bin/phpunit
    phpunit --version
    mark_step_complete step10_phpunit
fi

# =============================================================================
# STEP 11: Clone the piClinic repository
# =============================================================================

if ! step_is_done step11_clone; then
    echo "PICLINIC: --- STEP 11: Clone piClinic repository ---"
    cd ~
    if [ -d ~/piClinic/.git ]; then
        echo "Repository already present -- pulling latest changes."
        cd ~/piClinic
        git fetch origin
        git checkout $INSTALL_BRANCH
        git pull origin $INSTALL_BRANCH
    else
        git clone -b $INSTALL_BRANCH https://github.com/rbwatson/piClinic piClinic
        cd ~/piClinic
    fi
    git branch --show-current
    mark_step_complete step11_clone
fi

# =============================================================================
# STEP 12: Create application directories
# =============================================================================

if ! step_is_done step12_directories; then
    echo "PICLINIC: --- STEP 12: Create application directories ---"
    sudo mkdir -p /var/local/piclinic/image
    sudo mkdir -p /var/local/piclinic/deleted
    sudo mkdir -p /var/local/piclinic/downloads
    sudo chown -R www-data:www-data /var/local/piclinic
    sudo chmod -R 750 /var/local/piclinic
    sudo mkdir -p /var/log/piclinic
    sudo chown www-data:www-data /var/log/piclinic
    sudo chmod 770 /var/log/piclinic
    #
    # To allow a developer account interactive write access to the log directory:
    #   sudo usermod -aG www-data <username>
    # The change takes effect on the next login. To verify immediately (without
    # logging out), use: groups <username>
    # To activate in the current session without logging out: newgrp www-data
    mark_step_complete step12_directories
fi

# =============================================================================
# STEP 13: Database setup
# =============================================================================

if ! step_is_done step13_database; then
    echo "PICLINIC: --- STEP 13: Database setup ---"
    # This step creates the CTS-user account by copying the password to the
    #   target script before calling it
    cp ~/piClinic/sql/create_dbuser_raspi.sql ~/create_dbuser.sql
    sed -i "s/YOURPASSWORD/${DB_APP_PASSWORD}/g" ~/create_dbuser.sql
    cd ~/piClinic/sql
    mariadb -u admin -p"${DB_ADMIN_PASSWORD}" < piclinic.sql
    mariadb -u admin -p"${DB_ADMIN_PASSWORD}" piclinic < ~/create_dbuser.sql
    echo "   Initializing database tables. This may take a moment..."
    mariadb -u admin -p"${DB_ADMIN_PASSWORD}" piclinic < icd10.sql
    mariadb -u admin -p"${DB_ADMIN_PASSWORD}" piclinic < TestUsers.sql
    mariadb -u admin -p"${DB_ADMIN_PASSWORD}" piclinic < 100PatientsNum.sql
    mark_step_complete step13_database
fi

# =============================================================================
# STEP 14: Composer update + Deploy v2 API
# =============================================================================
#
# composer update is run before deploy.sh so that the lock file is regenerated
# for the current PHP version before the files are copied to /var/www.
# deploy.sh then runs composer install from the already-updated directory.
#
# If composer.lock changed, commit it to the repo before the final reboot
# so future installs do not require another update.
#
# The frontend build (npm run build) is a Phase 3 task -- www_v2/html/
# contains a placeholder index.html until the React frontend is built.
#
if ! step_is_done step14_deploy; then
    echo "PICLINIC: --- STEP 14: Composer update + Deploy v2 API ---"

    # Run composer update to regenerate lock file for current PHP version
    echo "  Running composer update in ~/piClinic/www_v2/html/api/ ..."
    cd ~/piClinic/www_v2/html/api
    composer update --no-interaction

    # Check if composer.lock changed and warn if so
    if ! git -C ~/piClinic diff --quiet www_v2/html/api/composer.lock 2>/dev/null; then
        queue_action_required ""
        queue_action_required "  composer.lock was updated for the current PHP version."
        queue_action_required "  Commit it to the repo so future installs do not require another update:"
        queue_action_required ""
        queue_action_required "      cd ~/piClinic"
        queue_action_required "      git add www_v2/html/api/composer.lock"
        queue_action_required "      git commit -m 'chore: update composer.lock for PHP 8.4'"
        queue_action_required "      git push"
        queue_action_required ""
    fi

    # Deploy (deploy.sh runs composer install from the updated directory)
    cd ~/piClinic
    DEPLOY_OUTPUT="$(bash tools/deploy.sh v2 2>&1)"
    echo "$DEPLOY_OUTPUT"

    # Extract any ACTION REQUIRED messages from deploy.sh output.
    # Keep only [deploy] WARN: lines, exclude === border lines, strip the prefix.
    if echo "$DEPLOY_OUTPUT" | grep -q 'ACTION REQUIRED'; then
        queue_action_required ""
        echo "$DEPLOY_OUTPUT" \
            | grep '\[deploy\] WARN:' \
            | grep -v '===' \
            | sed 's/\[deploy\] WARN:  \?/  /' \
            >> "$ACTION_REQUIRED_FILE" || true
    fi

    # Configure .env
    if ! sudo test -f /var/www/html/api/.env; then
        sudo cp /var/www/html/api/.env.example /var/www/html/api/.env
        sudo sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_APP_PASSWORD}/" /var/www/html/api/.env
        sudo chown www-data:www-data /var/www/html/api/.env
        sudo chmod 640 /var/www/html/api/.env
        echo ".env created and DB_PASSWORD set."
    else
        echo ".env already present -- leaving existing credentials in place."
    fi

    # Configure v1 dbPass.php
    if sudo test -f /var/www/pass/dbPass.php; then
        sudo sed -i "s/define('DB_PASS', '.*'/define('DB_PASS', '${DB_APP_PASSWORD}'/ " /var/www/pass/dbPass.php
        echo "dbPass.php updated with DB_APP_PASSWORD."
    fi

    # Queue reminder to review credential files
    queue_action_required ""
    queue_action_required "  Review and verify credential files before using the system:"
    queue_action_required "      sudo nano /var/www/html/api/.env       (v2 DB credentials)"
    queue_action_required "      sudo nano /var/www/pass/dbPass.php     (v1 DB credentials)"
    queue_action_required "      sudo nano /var/www/pass/clinicSpecific.php  (clinic settings)"
    queue_action_required ""

    mark_step_complete step14_deploy
fi

# =============================================================================
# STEP 15: Final system update and restart
# =============================================================================

if ! step_is_done step15_final_update; then
    echo "PICLINIC: --- STEP 15: Final system update ---"
    sudo apt-get update
    sudo apt-get upgrade -y
    sudo apt-get clean
    sudo apt-get autoremove -y
    mark_step_complete step15_final_update

    # Show any queued action-required messages and require acknowledgment
    # before the system reboots.
    show_action_required_and_confirm

    echo ""
    echo "All steps complete. The system will now restart."
    echo "After restart, run the environment check:"
    echo "    cd ~/piClinic/tools && python3 checkEnvironment.py"
    echo ""
    sudo shutdown -r now
    exit 0
fi

# =============================================================================
# All steps complete (reached only when all steps were already done)
# =============================================================================

# Show any leftover action-required messages (e.g. from a previous partial run)
show_action_required_and_confirm

echo ""
echo "=============================================================================="
echo " Installation complete."
echo "=============================================================================="
echo ""
echo " Run the environment check to verify all components:"
echo "     cd ~/piClinic/tools && python3 checkEnvironment.py"
echo ""
echo " Development workflow quick reference:"
echo "     PHP dev server:  php -S localhost:8000 -t www/html"
echo "     React dev server: cd ~/piClinic/frontend && npm run dev"
echo "     PHP tests:       cd ~/piClinic/www_v2/html/api && composer test"
echo "     Static analysis: cd ~/piClinic/www_v2/html/api && vendor/bin/phpstan analyse --level 8"
echo "     Frontend tests:  cd ~/piClinic/frontend && npm test"
echo "     Generate types:  cd ~/piClinic/frontend && npx openapi-typescript ~/piClinic/www_v2/html/api/docs/openapi.yaml --output src/api/types.ts"
echo ""
echo " See CLAUDE.md for full development guidance and coding standards."
echo ""
