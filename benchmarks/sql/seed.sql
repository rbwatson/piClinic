-- benchmarks/sql/seed.sql
-- Benchmark-specific seed data for the piClinic benchmark suite.
--
-- This script is run AFTER the base SQL files (TestClinics.sql,
-- 100PatientsNum.sql, TestUsers.sql) have been loaded by run-benchmark.sh.
-- It adds only the benchmark-specific records needed by the k6 test scripts.
--
-- Benchmark record identifiers are prefixed with BM- / BMV- to avoid
-- collisions with any production or general test data.

USE `piclinic`;

-- ---------------------------------------------------------------------------
-- Remove any leftover benchmark records from a prior run
-- ---------------------------------------------------------------------------
DELETE FROM `visit`   WHERE `patientVisitID` IN ('BMV-0001','BMV-0002','BMV-0003');
DELETE FROM `patient` WHERE `clinicPatientID` IN ('BM-0001','BM-0002','BM-0003');
DELETE FROM `staff`   WHERE `username` = 'bmtest';

-- ---------------------------------------------------------------------------
-- Benchmark staff account (bmtest)
-- Password hash matches the shared test password used in TestUsers.sql.
-- The plain-text password is stored in BENCHMARK_PASSWORD_FILE on the
-- machine running the benchmark.
-- ---------------------------------------------------------------------------
INSERT INTO `staff`
  (`memberID`, `username`, `lastName`, `firstName`, `position`,
   `password`, `active`, `accessGranted`, `modifiedDate`, `createdDate`)
VALUES
  ('BM-STAFF', 'bmtest', 'Test', 'Benchmark', 'ClinicStaff',
   '$2y$12$XgB7Mo4j7TqLd3sKLpva1OP/pXljsa58U3rIRtuLPOrcxmKOiyDsG',
   1, 'ClinicStaff', NOW(), NOW());

-- ---------------------------------------------------------------------------
-- Benchmark patients
-- Using high explicit patientIDs (9901-9903) to avoid collision with the
-- 100PatientsNum.sql dataset (IDs 1-100).
-- ---------------------------------------------------------------------------
INSERT INTO `patient`
  (`patientID`, `active`, `clinicPatientID`, `lastName`, `firstName`,
   `sex`, `homeCity`, `homeState`, `preferredLanguage`, `modifiedDate`, `createdDate`)
VALUES
  (9901, 1, 'BM-0001', 'Benchmark', 'Alpha',   'M', 'TestCity',  'BenchmarkState', 'en', NOW(), NOW()),
  (9902, 1, 'BM-0002', 'Benchmark', 'Beta',    'F', 'TestCity',  'BenchmarkState', 'en', NOW(), NOW()),
  (9903, 1, 'BM-0003', 'Testcase',  'Gamma',   'F', 'OtherCity', 'BenchmarkState', 'en', NOW(), NOW());

-- ---------------------------------------------------------------------------
-- Benchmark visits
-- Using explicit visitIDs (999001-999003) for the v1 "by integer visitID"
-- test variant. patientVisitIDs are short strings for readability.
--
-- BMV-0001: Open visit for BM-0001  (dashboard open-visit list)
-- BMV-0002: Closed visit for BM-0001 (patient visit history)
-- BMV-0003: Open visit for BM-0002  (visit by patientVisitID)
-- ---------------------------------------------------------------------------
INSERT INTO `visit`
  (`visitID`, `patientID`, `clinicPatientID`, `patientVisitID`,
   `firstVisit`, `visitType`, `visitStatus`,
   `patientLastName`, `patientFirstName`, `patientSex`,
   `patientHomeCity`, `patientHomeState`,
   `dateTimeIn`, `createdDate`)
VALUES
  (999001, 9901, 'BM-0001', 'BMV-0001',
   'NO', 'Clinic', 'Open',
   'Benchmark', 'Alpha', 'M', 'TestCity', 'Benchmark',
   NOW(), NOW()),
  (999002, 9901, 'BM-0001', 'BMV-0002',
   'NO', 'Clinic', 'Closed',
   'Benchmark', 'Alpha', 'M', 'TestCity', 'Benchmark',
   DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (999003, 9902, 'BM-0002', 'BMV-0003',
   'NO', 'Clinic', 'Open',
   'Benchmark', 'Beta', 'F', 'TestCity', 'Benchmark',
   NOW(), NOW());

-- ---------------------------------------------------------------------------
-- Benchmark comment record
-- Provides data for the "GET by username" and "GET by date" comment tests.
-- ---------------------------------------------------------------------------
DELETE FROM `comment` WHERE `username` = 'bmtest';

INSERT INTO `comment`
  (`username`, `commentText`, `referringUrl`, `referringPage`, `createdDate`)
VALUES
  ('bmtest', 'Benchmark seed comment', '/benchmark', 'benchmark', NOW());

-- ---------------------------------------------------------------------------
-- Benchmark log record
-- Provides data for the log GET tests (by logDate, logClass, sourceModule).
-- ---------------------------------------------------------------------------
INSERT INTO `log`
  (`sourceModule`, `userToken`, `logClass`, `logStatusCode`, `logStatusMessage`, `createdDate`)
VALUES
  ('benchmark', 'benchmark-seed', 'info', 200, 'Benchmark seed log entry', NOW());

-- ---------------------------------------------------------------------------
-- Sanity check: verify ICD-10 codes needed by the benchmark are present.
-- A00.0 is used for the "by diagnosis code" test.
-- Z00.x is used for the "by index prefix" test.
-- The icd10 table is NOT truncated or modified by this script.
-- ---------------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM `icd10` WHERE `icd10index` = 'A00.0')   AS `A00_0_exists`,
  (SELECT COUNT(*) FROM `icd10` WHERE `icd10index` LIKE 'Z00%') AS `Z00x_exists`;
