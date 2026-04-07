#/bin/bash
#
#	Instructions updated for 2025-12-04 release of Raspberry Pi OS (64-bit)
#   with desktop (https://www.raspberrypi.com/software/operating-systems/)
#
#   This process can take from 60-90 minutes to complete.
#
#       This process is divided into two parts:
#           1) Configure the base OS for the piClinic hardware and application software
#           2) Install the piClinic application software
#           3) Save the SD card image for use in copying to other SD cards for production use
#           4) Configure the piClinic application software for use in the specific clinic environment
#
# For ease of copying the base image:
#   1. Download a current version of the Raspberry Pi OS (64-bit)
#               with desktop from https://www.raspberrypi.com/software/operating-systems/
#       If necessary, download the Raspberry Pi Imager from https://www.raspberrypi.com/software/
#               and use it to load the OS on to a 32-GB (or larger) microSD card.
#   2. Run the imager and configure the OS location, username, and network information as desired
#               using the advanced options in the imager.
#	Set Country
#		For a dev system:
#			Country: United States
#			Language: American English
#			Timezone: (as appropriate)
#		For a customer system:
#			Country: (as appropriate)
#			Language: (as appropriate: English, Spanish, are the only options currently supported)
#			Timezone: (as appropriate)
#       After the OS is loaded on to the SD Card, install the card into the raspberry pi and boot
#               from the microSD card.
#   3. Log into the pi and run the update command from the GUI header.
#   4. The system should be ready to run normally after that
#
#*****************************************************************************
#
#   NOTE: Although this is written as a script, DO NOT EXECUTE IT as one.
#     There are numerous cases where the system must be restarted before
#     continuing and that is not accounted for in this script.
#
#     Use this script as a guide from which you can copy, paste, and edit
#     the commands as necessary.
#
#*****************************************************************************
#
#	Start here if your installing a clean OS as downloaded from raspberrypi.com.
#   Install the version that HAS the GUI desktop but DOES NOT HAVE the apps
#   The required apps will be installed by this procedure
#	If you are starting from a pre-configured piClinic OS image, start futher down the page
#
#	Power up system with fresh OS on SD card.
#	In a terminal window. Remove some unused software before continuing.
sudo apt-get purge
sudo apt-get clean
sudo apt-get autoremove
sudo shutdown -r 0
#
#       If your pi has been configured with an add-on RTC, configure it now before installing the software.
#	Configure the RealTime clock (make sure that it's been installed on the Pi board.)
# 	This is easiest if done while connected to the Internet
#
#		1) Load the RTC module by entering:
#			sudo modprobe rtc-ds1307
#		2) Restart the pi
#		3) Add the device to the list of modules
#			sudo nano /etc/modules
#				add "rtc-ds1307" (without quotes) to the end of the file, and save the changes
#				save changes and exit
#		4) Add the device to the rc file before the "exit 0" command
#			sudo nano /etc/rc.local
#				add these lines before the exit command:
#					echo ds1307 0x68 > /sys/class/i2c-adapter/i2c-1/new_device
#					sudo hwclock -s
#					date
#				save changes and exit
#		5) Restart the pi
#			after it restarts, make sure the time is correct
#     this command displays the realtime clock's time
#       sudo hwclock -r
#
#	if not, refer to https://thepihut.com/blogs/raspberry-pi-tutorials/17209332-adding-a-real-time-clock-to-your-raspberry-pi from where these instructions were found
#
# *************************************************************************
#		At this point the basic OS has been configured for the piClinic hardware
# *************************************************************************
#
# STEP 1: run the commands up to STEP 2 from the command line.
#       Installation script starts here
#
# install basic system software
sudo apt-get -y install nload
# *************************************************************************
#		Install Apache, PHP, and MySQL (MariaDB) for the web server and database
# *************************************************************************
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
# Install Composer for PHP dependency management
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
#
# =============================================================================
# STEP 8: Node.js 20 LTS (for React frontend development)
# =============================================================================
#
# Install Node.js 20 LTS via NodeSource. The v2 plan requires Node 18+;
# Node 20 LTS is the current stable release.
#
cd ~
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
# =============================================================================
# STEP 10: MariaDB (MySQL-compatible database)
# =============================================================================
#
sudo apt-get -y install mariadb-server-10.0
sudo apt-get -y install mariadb-client-10.0
#
# Set mysql password
#   This must be done as a super user using (sudo su) access
#  	from: https://www.digitalocean.com/community/tutorials/how-to-reset-your-mysql-or-mariadb-root-password
#
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables --skip-networking &
mysql -u root
# in mysql
#	change new_password to your new root password.
#       FLUSH PRIVILEGES;
#       CREATE USER 'root'@'localhost' IDENTIFIED BY 'new_password';
#       GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
#   If root@localhost exists, just change its new_password
#     SET PASSWORD FOR 'root'@'localhost' = PASSWORD('new_password');
#
#   create an admin password (this works better for user access to
#     administer the database)
#     CREATE USER 'admin'@'localhost' IDENTIFIED BY 'new_password';
#     GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost';
#
# 		exit
# kill mysqld_safe process, first
#	list running processes:
#		 ps
#	find id of mysqld_safe process and use it in the following command
#		sudo kill <id>
#
# restart the system
sudo shutdown -r 0
#	start the real service
#
sudo systemctl start mysql
# test the new password
mysql -u admin -p
#	This should prompt you for the password.
#	Enter the one you just assigned above and you should get the MariaDB [(none)]> prompt.
# 	If it does, exit and continue
#	If not, try to reassign the password and try again.
#
# run this command on a production systems
sudo mysql_secure_installation
#
#	restart the system
sudo shutdown -r 0
#
#	After it restarts:
#		Check Apache: 	open http://localhost in a browser and make sure it displays the default page
#		Check PHP: 		open http://localhost/phpinfo.php to make sure it displays info about PHP
#
# update the packages & restart
sudo apt-get update
sudo apt-get upgrade
sudo apt-get clean
sudo apt-get autoremove
# restart to begin application software install and config
sudo shutdown -r 0
#
# Configure PHP
sudo nano /etc/php/8.4/apache2/php.ini
#
#   review timezone strings from https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
#		and pick the correct one for the system's location
#   edit the PHP ini file and change these settings on all configurations
#
#     		memory_limit = 512M
#     		date.timezone = <insert a standard UNIX timezone string>
#                           see the wikipedia link above, such as
#                               America/Tegucigalpa for Honduras
#                               America/Los_Angeles for Pacific time
#                               America/New_York for Eastern time
#
#   change these settings if you are configuring a development system
#
#     display_errors = On
#     display_startup_errors = On
#
#   save changes
#	restart apache
#		sudo systemctl restart apache2
#
#		open http://localhost/phpinfo.php to make sure the settings you updated have the values
#
#	Update the Apache configuration in  /etc/apache2/apache2.conf
sudo nano /etc/apache2/apache2.conf
#
#   Find the <Directory /var/www/> entry in the file and make it look like this
#
<Directory /var/www/>
        Options FollowSymLinks
        AllowOverride None
        Require all granted
        DirectoryIndex piclinic.php index.php index.html
</Directory>
#
#		TODO: Add other security commands and apache config here
#
#	restart apache (or the system)
sudo systemctl restart apache2
#
# *************************************************************************
#		At this point the system has the pre-configured SYSTEM System software
#			but it has no application (piClinic) software or settings.
#
#		The next steps configure the system for the piClinic application software
#
# *************************************************************************
#
# *****  Checkpoint CP1 *****
#
# *************************************************************************
#	The script has not been tested for the 2025-12-04 version of the OS
#			past this point.
#
#		REMOVE THIS MESSAGE AFTER THE SCRIPT HAS BEEN TESTED WITH THE NEW OS
#
# *************************************************************************
#
#	add users
#
#   add the clinic user and group
sudo groupadd clinic
sudo useradd clinic -g clinic
sudo usermod -a -G audio clinic
sudo usermod -a -G video clinic
#
#   set an initial password (to change during clinic installation)
# sudo passwd clinic
#
# 	create the home directory for the clinic account
#
sudo mkdir /home/clinic
sudo chown clinic /home/clinic
#
# 	Log into the clinic account and:
#		Open the browser and configure the settings for the piClinic
#			TODO: this should be documented somewhere...
# 		Turn off bluetooth
#
#	*** note: be sure to remove any wifi settings before saving the system image ***
#	*** 		and clear the browser history so it won't be replicated on other computers ***
#
# *************************************************************************
#		At this point the system has the pre-configured piClinic System software
#			and is what is stored on the saved base OS images.
#
#		The next steps install the piClinic application software
#
# *************************************************************************
#
#	On first boot from a saved image, it might be necessary to resize the FS to
#	use the avaliable memory on the microSD card
#
#	From a terminal window, run
#		df -h
#
#	Install the software from GitHub
#
cd ~
git clone https://github.com/rbwatson/piClinic piClinic

#
# create app folders
sudo mkdir /var/local
sudo mkdir /var/local/piclinic
sudo mkdir /var/local/piclinic/image
sudo mkdir /var/local/piclinic/deleted
sudo mkdir /var/local/piclinic/downloads
sudo chown -R www-data:www-data /var/local/piclinic
sudo chmod -R 750 /var/local/piclinic
#
sudo mkdir /var/log/piclinic
sudo chown -R www-data:www-data /var/log/piclinic
sudo chmod -R 750 /var/log/piclinic
#
#
echo 'Test your web server now by opening http://localhost in a browser.'
echo 'Update the password in the ~/create_dbuser.sql file before installing the databases'
echo 'After editing the password file, follow the commands that follow and enter them manually as directed.'
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
#   cd ~/piClinic/www_v2/html/api/
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
              @testing-library/user-event @testing-library/jest-dom \
              msw playwright @playwright/test
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
# =============================================================================
#
# copy this file and edit the password before running it
cp ~/piClinic/sql/create_dbuser.sql ~/.
#
# after editing the password in create_dbuser.sql,
#    run this command to create the db user account
sudo mysql -uroot -pYOURPASSWORD  < ~/create_dbuser.sql
##
# install app database and database user account
cd ~/piClinic/sql
sudo mysql -uroot -pYOURPASSWORD < piclinic.sql
# sudo mysql -uroot -pYOURPASSWORD < HondurasClinics.sql
sudo mysql -uroot -pYOURPASSWORD < TestUsers.sql
sudo mysql -uroot -pYOURPASSWORD < icd10.sql
#
#       Deploy software to the web server
#
cd ~/piClinic/tools
./deploy.sh v2
#
# edit password(s) in /var/www/pass/dbPass.php to match the password you
#   put in in the create_dbuser.sql script
#
echo 'For v2 deployments, edit the credentials in /var/www/html/api/.env before running the app.'
echo 'Edit the clinic-specific configuration in /var/www/pass/clinicSpecific.php before running the app.'
echo 'Edit the database password in /var/www/html/dbPass.php before running app.'
exit
#
#------------------------------------
# STOP HERE to have a complete system, with the app, but with no patients
#   Continue to add test data for development and testing
#------------------------------------
#
# load test patients into the database
# cd ~/piClinic/tools
# change GEN-PAT-1- to your patient ID prefix. Patients will be numbered squentially.
#  change 100 to however many patient records you want to create
#  the script takes about 15 minutes to add 10,000 patients and their photos
# python3 create-patients.py GEN-PAT-1- 100
#
# load test visits into the database
#   change 100 to the number of days worth of data you want to create
#   change 50 to the number of visits per day you want to create
#
# python3 create-visits.py 100  50
#
# ------------------------------------------------
#
# to update web site after a commit see the wiki
#
