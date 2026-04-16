-- CreateE2ETestUser.sql
-- Creates the piclinic_e2e database account and the E2E application user.
--
-- SETUP INSTRUCTIONS
-- ==================
-- 1. Choose two passwords:
--      E2E_DB_PASSWORD  — used by the test runner to connect to MariaDB directly
--      E2E_TEST_PASSWORD — used by Playwright to log in to the piClinic UI
--
-- 2. Generate a bcrypt hash of E2E_TEST_PASSWORD:
--      php -r "echo password_hash('YOUR_E2E_TEST_PASSWORD', PASSWORD_DEFAULT);"
--    Copy the full output string (starts with $2y$).
--
-- 3. Set the three variables below, then run:
--      mysql -u root -p piclinic < sql/CreateE2ETestUser.sql
--
-- 4. Copy the same values into frontend/e2e/.env.e2e:
--      E2E_DB_PASSWORD=<same as @e2e_db_password below>
--      E2E_TEST_PASSWORD=<same as @e2e_test_password below>
--
-- piclinic_e2e: DB account — SELECT + DELETE on piclinic.*
--   SELECT  — read stored values for test verification
--   DELETE  — remove test records during teardown
--   No INSERT or UPDATE — test data creation goes through the REST API
--
-- e2e_testuser: piClinic application account used to log in during tests

-- ---------------------------------------------------------------------------
-- SET THESE THREE VALUES BEFORE RUNNING
-- ---------------------------------------------------------------------------

-- Password for the piclinic_e2e MariaDB account
-- Must match E2E_DB_PASSWORD in frontend/e2e/.env.e2e
SET @e2e_db_password = 'CHANGE_ME_DB_PASSWORD';

-- Plaintext password for the e2e_testuser piClinic login
-- Must match E2E_TEST_PASSWORD in frontend/e2e/.env.e2e
-- (Only used below in the comment — the actual stored value is the bcrypt hash)
SET @e2e_test_password = 'CHANGE_ME_APP_PASSWORD';

-- Bcrypt hash of @e2e_test_password
-- Generate with: php -r "echo password_hash('CHANGE_ME_APP_PASSWORD', PASSWORD_DEFAULT);"
-- Paste the full output here (starts with $2y$)
SET @e2e_test_password_hash = 'CHANGE_ME_BCRYPT_HASH';

-- ---------------------------------------------------------------------------
-- DB account
-- ---------------------------------------------------------------------------

SET @create_user_sql = CONCAT(
  'CREATE USER IF NOT EXISTS ''piclinic_e2e''@''localhost'' IDENTIFIED BY ''',
  @e2e_db_password, ''''
);
PREPARE stmt FROM @create_user_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- If the account already existed, update its password to match
SET @alter_user_sql = CONCAT(
  'ALTER USER ''piclinic_e2e''@''localhost'' IDENTIFIED BY ''',
  @e2e_db_password, ''''
);
PREPARE stmt FROM @alter_user_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

GRANT SELECT, DELETE
  ON piclinic.*
  TO 'piclinic_e2e'@'localhost';

FLUSH PRIVILEGES;

-- ---------------------------------------------------------------------------
-- Application test user
-- ---------------------------------------------------------------------------

SET @insert_staff_sql = CONCAT(
  'INSERT INTO staff ',
  '(username, lastName, firstName, position, active, accessGranted, preferredLanguage, password) ',
  'VALUES (''e2e_testuser'', ''E2E'', ''TestUser'', ''ClinicStaff'', 1, ''ClinicAdmin'', ''en'', ''',
  @e2e_test_password_hash, ''') ',
  'ON DUPLICATE KEY UPDATE ',
  'password = VALUES(password), ',
  'accessGranted = VALUES(accessGranted), ',
  'active = VALUES(active)'
);
PREPARE stmt FROM @insert_staff_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Confirm what was created
SELECT 'piclinic_e2e DB account:' AS item, User, Host
  FROM mysql.user WHERE User = 'piclinic_e2e'
UNION ALL
SELECT 'e2e_testuser app account:', username, accessGranted
  FROM staff WHERE username = 'e2e_testuser';
