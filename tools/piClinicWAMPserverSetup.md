# Setup for WAMPServer on Windows 10


Instructions for running piClinic software on WAMPServer on Windows 10. 
This process can take from 60-90 minutes to complete.

1. Install WAMPServer for Windows 10

    1. In https://wampserver.aviatechno.net/?lang=en, open **Installers**
        and install latest.

    2. Add path to these WAMP command line executables to the system and user environments.
        By default these programs are found in a subdirectory of `c:\wamp\bin`.
        1. `php.exe`
        2. `mysql.exe`

    3. Restart Windows

2. Create the piClinic project in the WAMPserver.

   1. Open a command line window with Administrator privileges.
   2. Go to the WAMPserver directory and create the `piclinic` directory

        ```cmd
        cd c:\wamp\www
        mkdir piClinic
        cd piClinic
        ```

3. In the piClinic directory create `phpinfo.php`

    1. In the commandline window, open `Notepad.exe`.
    2. Copy `<?php phpinfo(); ?>` into Notepad.
    3. Save the file and close Notepad.

4. Test the piClinic site.

    1. In a browser on the Windows computer, open `http://localhost/piClinic/phpinfo.php`.
    2. Review the PHP configuration, or troubleshoot why the page didn't appear.

5. Set the mysql password.

    1. In the command line window with administrator privilege:

        1. Open `mysql` as `root` with the command `mysql -u root`
        1. At the `mysql>` prompt, enter:

            ```sql
            FLUSH PRIVILEGES;
            CREATE USER 'admin'@'localhost' IDENTIFIED BY 'new_password';
            GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost';
            ```

            If you get an error trying to create the user `admin`, it probably already exists
            so, update the password with these SQL commands:

            ```sql
            SET PASSWORD FOR 'admin'@'localhost' = PASSWORD('new_password');
            exit
            ```

    2. From a browser on the Windows computer, open `http://localhost/phpmyadmin`.
    3. Log in to `phpmyadmin` using the `admin` credentials you created in the previous step and
        selecting the `MySql` server.

        1. In `phpmyadmin`, open the **User accounts** tab to review the users that have been created.
        2. Consider disabling or adding a password to the `root` account.
        3. Exit `phpmyadmin`.

6. Initialize databases and tables

cd ~
git clone https://github.com/docsbydesign/piClinic piClinic
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
exit
#
# copy this file and edit the password before running it
cp ~/piClinic/sql/create_dbuser_ubuntu.sql ~/.
#
# after editing the password in create_dbuser.sql,
#    run this command to create the db user account
sudo mysql -uroot  < ~/create_dbuser_ubuntu.sql
##
# install app database and database user account
cd ~/piClinic/sql
mysql -uadmin -pYOURPASSWORD < piclinc.sql
mysql -uadmin -pYOURPASSWORD < icd10.sql
#
# copy the app files to create the web site
sudo cp -R ~/piClinic/www/* /var/www/.
sudo chown -R www-data:www-data /var/www/*
sudo chmod -R 750 /var/www/*
sudo chmod -R 755 /var/www/scripts/*
#
# edit password(s) in /var/www/pass/dbPass.php to match the password you
#   put in in the create_dbuser.sql script
#
echo 'Edit the database password in /var/www/html/dbPass.php before running app.'
exit
#
#   For dev/test systems, load test databases
# example staff database
mysql -uadmin -pYOURPASSWORD < TestUsers.sql
# example patient databases
mysql -uadmin -pYOURPASSWORD < 100PatientsNum.sql
# mysql -uadmin -pYOURPASSWORD < 100Patients.sql
#
#------------------------------------
# STOP HERE to have a complete system, with the app, but with no patients
#   Continue to add test data for development and testing
#------------------------------------
#
# to update web site after a commit see the wiki
#
