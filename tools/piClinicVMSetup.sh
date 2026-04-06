#!/bin/bash
#
#   Instructions for setting up a piClinic v2 development and test environment
#   on Ubuntu 24.04 LTS in a VirtualBox VM.
#
#   Target: piClinic v2 development and testing (React frontend + PHP 8.2+ backend)
#   Host OS: Ubuntu 24.04 LTS (Noble Numbat)
#   VirtualBox: 7.x or later
#
#   Recommended VM settings to simulate Raspberry Pi 3B+ constraints:
#       General:    Ubuntu (64-bit)
#       System:
#           Base memory:    8192 MB  (headroom for dev tools; Pi 3B+ has 1 GB)
#           Processors:     2
#           Boot order:     Optical, Hard Disk
#       Display:    128 MB, VMSVGA
#       Storage:    VDI, 16 GB (minimum; 32 GB recommended for databases and test data)
#       Network:    Bridged adapter
#       Shared folders: as required for your workflow
#
#   Download Ubuntu 24.04 LTS .iso from https://ubuntu.com/download/desktop
#   Attach as optical disk image and install the OS before running this script.
#
#   After OS install, add VirtualBox guest utilities:
#       sudo apt install -y virtualbox-guest-dkms virtualbox-guest-x11
#   Note: you might need to install the guest addtions from the VirtualBox menu
#       or a local .iso disk image instead, depending on your setup.
#   Then restart before continuing.
#
#*****************************************************************************
#
#   NOTE: Although this is written as a script, DO NOT EXECUTE IT as one.
#     There are cases where you must edit files or restart the system before
#     continuing. Use this as a step-by-step reference: read each section,
#     copy and run the commands manually, then proceed to the next section.
#
#*****************************************************************************
#
# =============================================================================
# STEP 1: System update and base utilities
# =============================================================================
#
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y git net-tools nload curl wget gnupg2 ca-certificates \
    apt-transport-https software-properties-common lsb-release
sudo apt-get clean
sudo apt-get autoremove -y
#
# =============================================================================
# STEP 2: Apache web server
# =============================================================================
#
sudo apt-get install -y apache2 apache2-doc
#
# Enable required Apache modules
sudo a2enmod rewrite
sudo a2enmod headers
#
sudo systemctl enable apache2
sudo systemctl start apache2
#
# Verify: open http://localhost in a browser -- should show the Apache default page.
#
# =============================================================================
# STEP 3: PHP 8.2+
# =============================================================================
#
# Ubuntu 24.04 ships with PHP 8.3. The v2 target is PHP 8.2+, so either
# version works. These commands install the default PHP version from the
# Ubuntu 24.04 repos (8.3). To pin to 8.2 instead, use the ondrej/php PPA:
#   sudo add-apt-repository ppa:ondrej/php
#   sudo apt-get update
#   sudo apt-get install -y php8.2 php8.2-common php8.2-fpm php8.2-mysql ...
#
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
#
# Verify the installed PHP version
php -v
#
# Create a PHP info page for browser verification
sudo bash -c 'echo "<?php phpinfo(); ?>" > /var/www/html/phpinfo.php'
sudo chown www-data:www-data /var/www/html/phpinfo.php
sudo chmod 750 /var/www/html/phpinfo.php
#
# Verify: open http://localhost/phpinfo.php -- should show PHP info page.
#
# =============================================================================
# STEP 4: Configure PHP for development
# =============================================================================
#
# Find the correct php.ini path for your installed version, then edit it.
# The path will be something like /etc/php/8.3/apache2/php.ini
php --ini | grep "Loaded Configuration"
#
# Edit the Apache-facing php.ini:
sudo nano /etc/php/8.3/apache2/php.ini
#
#   Change or confirm these settings:
#
#       memory_limit = 512M
#       date.timezone = America/Los_Angeles
#           (use your timezone; see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
#
#   For a development system, also set:
#       display_errors = On
#       display_startup_errors = On
#       error_reporting = E_ALL
#
#   Save and close the file.
#
sudo systemctl restart apache2
#
# Verify: reload http://localhost/phpinfo.php and confirm memory_limit and
#   date.timezone reflect your changes.
#
# =============================================================================
# STEP 5: Configure Apache for piClinic
# =============================================================================
#
sudo nano /etc/apache2/apache2.conf
#
#   Find the <Directory /var/www/> block and update it to:
#
# <Directory /var/www/>
#         Options FollowSymLinks
#         AllowOverride All
#         Require all granted
#         DirectoryIndex index.php index.html
# </Directory>
#
sudo systemctl restart apache2
#
# =============================================================================
# STEP 6: MySQL 8
# =============================================================================
#
# Ubuntu 24.04 installs MySQL 8.0 by default.
#
sudo apt-get install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
#
# Run the secure installation wizard.
# You will be prompted to set the root password and remove test databases.
sudo mysql_secure_installation
#
# Create the piClinic application database user.
# Replace 'new_password' with a strong password you choose.
# Note the password -- you will need it in later steps and in the app config.
#
sudo mysql -u root -p <<'EOF'
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'new_password';
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EOF
#
# Verify: connect with the new account
mysql -u admin -p
#   Should prompt for password and open the MySQL shell.
#   Type: exit
#
# =============================================================================
# STEP 7: Composer (PHP dependency manager)
# =============================================================================
#
cd ~
# get current setup instructions from https://getcomposer.org/download/
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
# curl -sS https://getcomposer.org/installer -o composer-setup.php
#
# Get the expected installer signature from the Composer website
HASH="$(curl -sS https://composer.github.io/installer.sig)"
# Verify the installer matches the expected signature to ensure it's not corrupted or tampered with.
php -r "if (hash_file('SHA384', 'composer-setup.php') === '$HASH') { echo 'Installer verified'; } else { echo 'Installer INVALID - do not run'; exit(1); } echo PHP_EOL;"
#
# If verified:
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
rm composer-setup.php
#
# Verify
composer --version
#
# =============================================================================
# STEP 8: Node.js 20 LTS (for React frontend development)
# =============================================================================
#
# Install Node.js 20 LTS via NodeSource. The v2 plan requires Node 18+;
# Node 20 LTS is the current stable release.
#
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
#
# Verify
node -v
npm -v
#
# =============================================================================
# STEP 9: PHP development tools (PHPUnit and PHPStan)
# =============================================================================
#
# These are installed per-project via Composer (see STEP 11), but you can
# also install PHPUnit globally for convenience.
#
# Install PHPUnit 12.x globally (last version supporting PHP 8.3).
# PHPUnit 13.x requires PHP 8.4+. Revisit when PHP 8.4 is available.
sudo wget -O /usr/local/bin/phpunit https://phar.phpunit.de/phpunit-12.phar
sudo chmod +x /usr/local/bin/phpunit
phpunit --version
#
# PHPStan is installed per-project via Composer (see STEP 11).
#
# =============================================================================
# STEP 10: Clone the piClinic repository
# =============================================================================
#
cd ~
git clone -b react-refactor https://github.com/rbwatson/piClinic piClinic
cd piClinic
#
# Verify you are on the correct branch
git branch --show-current
#   Should show: react-refactor
#
# =============================================================================
# STEP 11: Install PHP (backend) dependencies via Composer
# =============================================================================
#
# This step requires a composer.json in the backend directory.
# When the v2 backend directory structure is created, run Composer from that
# directory. The dependencies below are defined in CLAUDE.md as required for v2.
#
# Example (run from the directory containing composer.json once it exists):
#
#   cd ~/piClinic/www/html/api
#   mkdir v2
#   cd v2
#   composer require firebase/php-jwt
#   composer require monolog/monolog
#   composer require respect/validation:^2.3
#       Note: respect/validation v3.x requires PHP 8.5+. Pin to v2.x for
#       compatibility with PHP 8.2/8.3. Revisit when PHP 8.5 is available.
#   composer require zircote/swagger-php
#   composer require vlucas/phpdotenv
#
#   composer require --dev phpunit/phpunit:^12
#       Note: PHPUnit 13.x requires PHP 8.4+. Pin to v12.x for compatibility
#       with PHP 8.2/8.3. Revisit when PHP 8.4 is available.
#   composer require --dev phpstan/phpstan
#
# =============================================================================
# STEP 12: Initialize the React frontend project
# =============================================================================
#
# This step creates the frontend/ directory with Vite + React + TypeScript.
# Run this once when ready to begin Phase 3 frontend work.
#
#   cd ~/piClinic
#   npm create vite@latest frontend -- --template react-ts
#   cd frontend
#   npm install
#
#   Install core frontend dependencies (from CLAUDE.md):
#   npm install react-router-dom @tanstack/react-query axios
#   npm install react-hook-form yup
#   npm install react-i18next i18next
#
#   Install dev dependencies:
#   npm install -D vitest @vitest/coverage-v8 @testing-library/react \
#               @testing-library/user-event @testing-library/jest-dom \
#               msw playwright @playwright/test
#
# =============================================================================
# STEP 13: Create application directories
# =============================================================================
#
sudo mkdir -p /var/local/piclinic/image
sudo mkdir -p /var/local/piclinic/deleted
sudo mkdir -p /var/local/piclinic/downloads
sudo chown -R www-data:www-data /var/local/piclinic
sudo chmod -R 750 /var/local/piclinic
#
sudo mkdir -p /var/log/piclinic
sudo chown www-data:www-data /var/log/piclinic
sudo chmod 770 /var/log/piclinic
#
# Developer accounts that run tests interactively need write access to the log
# directory. Add each developer's username to the www-data group, then log out
# and back in (or run: newgrp www-data) for the change to take effect.
#
#   sudo usermod -aG www-data <username>
#
# =============================================================================
# STEP 14: Database setup
# =============================================================================
#
# Edit the password in the DB user creation script before running it.
cp ~/piClinic/sql/create_dbuser_ubuntu.sql ~/create_dbuser_ubuntu.sql
nano ~/create_dbuser_ubuntu.sql
#   Replace the placeholder password with the password you set in STEP 6.
#   Save and close.
#
sudo mysql -u root < ~/create_dbuser_ubuntu.sql
#
# Install the application database schema
cd ~/piClinic/sql
mysql -u admin -p piclinic < piclinic.sql
mysql -u admin -p piclinic < icd10.sql
#
# Load test data for development and testing
mysql -u admin -p piclinic < TestUsers.sql
mysql -u admin -p piclinic < 100PatientsNum.sql
#
# =============================================================================
# STEP 15: Deploy v2 API and configure environment
# =============================================================================
#
# Run the deploy script to copy the v2 API files and install Composer
# dependencies. The frontend build is not required yet for API-only testing --
# the placeholder index.html in www_v2/html/ satisfies the deploy check.
#
cd ~/piClinic
bash tools/deploy.sh v2
#
# The deploy script copies .env.example but does NOT create .env.
# Create and configure the .env file for the v2 API:
#
sudo cp /var/www/html/api/.env.example /var/www/html/api/.env
sudo nano /var/www/html/api/.env
#
#   Set DB_PASSWORD to the CTS-user password configured in STEP 6.
#   For a development system, also consider:
#       APP_DEBUG=true      (enables stack traces in API error responses)
#       LOG_LEVEL=debug     (verbose logging)
#   Save and close.
#
sudo chown www-data:www-data /var/www/html/api/.env
sudo chmod 640 /var/www/html/api/.env
#
# Note: .env is separate from the v1 pass/ credentials.
#   v1 credentials:  /var/www/pass/   (PHP include files)
#   v2 credentials:  /var/www/html/api/.env   (phpdotenv)
#
# Verify the API responds (replace 'localhost' with the VM IP if testing
# from the host machine):
#
#   curl -s -X POST http://localhost/api/v2/auth/login \
#        -H 'Content-Type: application/json' \
#        -d '{"username":"testuser","password":"testpass"}' | python3 -m json.tool
#
# =============================================================================
# STEP 16: Final system update and restart
# =============================================================================
#
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get clean
sudo apt-get autoremove -y
sudo shutdown -r 0
#
# =============================================================================
# Checkpoint: verify the environment after restart
# =============================================================================
#
# Run the environment check script to verify all components are installed
# and configured correctly:
#
cd ~/piClinic/tools
python3 checkEnvironment.py
#
# The script checks Apache, PHP version, MySQL connectivity, Composer, Node.js,
# npm, PHPUnit, the active git branch, and the piClinic application directories.
# It will prompt for the MySQL admin password.
#
# All checks should pass before starting development work. If any checks fail,
# follow the solution guidance printed by the script, or refer to the
# corresponding step in this file.
#
# =============================================================================
# Development workflow quick reference
# =============================================================================
#
# Start PHP dev server (from project root):
#   php -S localhost:8000 -t www/html
#
# Start React dev server (from frontend/):
#   npm run dev
#
# Run PHP tests:
#   composer test                         (from backend directory)
#   vendor/bin/phpstan analyse --level 8
#
# Run frontend tests:
#   npm test
#   npm run test:coverage
#   npm run test:e2e
#
# Generate TypeScript types from OpenAPI spec:
#   npx openapi-typescript ../www/html/api/v2/docs/openapi.yaml \
#       --output src/api/types.ts
#
# See CLAUDE.md for full development guidance and coding standards.
#
