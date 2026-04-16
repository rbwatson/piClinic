-- CreateE2ETestUser.sql
-- Creates the piclinic_e2e database account and the E2E application user.
--
-- Run once during dev environment setup:
--   mysql -u root -p piclinic < sql/CreateE2ETestUser.sql
--
-- Substitute the placeholder passwords before running.
-- The DB password must match E2E_DB_PASSWORD in frontend/e2e/.env.e2e.
-- The app password must match E2E_TEST_PASSWORD in frontend/e2e/.env.e2e.
--
-- piclinic_e2e: DB account — SELECT + DELETE on piclinic.*
--   SELECT  — read stored values for test verification
--   DELETE  — remove test records during teardown
--   No INSERT or UPDATE — test data creation goes through the REST API
--
-- e2e_testuser: piClinic application account used to log in during tests

-- ---------------------------------------------------------------------------
-- DB account
-- ---------------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'piclinic_e2e'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_E2E_DB_PASSWORD';

GRANT SELECT, DELETE
  ON piclinic.*
  TO 'piclinic_e2e'@'localhost';

FLUSH PRIVILEGES;

-- ---------------------------------------------------------------------------
-- Application test user (logs in to the piClinic UI during E2E tests)
-- Inserted into the staff table that already exists.
-- Adjust accessGranted if tests need admin-level access.
-- ---------------------------------------------------------------------------
INSERT INTO staff (
  username, lastName, firstName,
  position, active,
  accessGranted, preferredLanguage,
  password
) VALUES (
  'e2e_testuser', 'E2E', 'TestUser',
  'ClinicStaff', 1,
  'ClinicAdmin', 'en',
  -- Store a bcrypt hash of your chosen password.
  -- Generate with: php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT);"
  'CHANGE_ME_BCRYPT_HASH_OF_E2E_TEST_PASSWORD'
)
ON DUPLICATE KEY UPDATE
  accessGranted    = VALUES(accessGranted),
  active           = VALUES(active);
