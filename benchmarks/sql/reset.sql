-- benchmarks/sql/reset.sql
-- Truncate all tables that the benchmark suite touches.
-- Run this BEFORE the base SQL files and seed.sql to start from a clean state.
--
-- Tables NOT touched: icd10 (read-only by benchmark), log, comment
-- (log and comment accumulate during the run; they are not reset between runs).

USE `piclinic`;

TRUNCATE TABLE `session`;
DELETE FROM `visit`;
TRUNCATE TABLE `patient`;
DELETE FROM `staff` WHERE `username` NOT IN ('SystemAdmin');
TRUNCATE TABLE `clinic`;
