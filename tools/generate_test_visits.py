#!/usr/bin/env python3
"""
generate_test_visits.py

Generates realistic test visit records directly in the piClinic database.
Reads existing patient and staff records to build correctly structured
visit rows, including patient snapshot fields and patientVisitID.

Usage:
    python3 generate_test_visits.py [--days N] [--config PATH] [--dry-run]

Arguments:
    --days N      Number of past weekdays to generate visits for (default: 60)
    --config PATH Path to piclinic_setup.conf (default: ../tools/piclinic_setup.conf)
    --dry-run     Print SQL statements instead of executing them

Load order requirement:
    piclinic.sql -> TestClinics.sql -> TestUsers.sql -> 100Patients.sql
    -> generate_test_visits.py

Warning: TestUsers.sql drops and recreates the staff table. Run it before
this script, not after. The SystemAdmin account from piclinic.sql will be
lost if TestUsers.sql is run after setup; reload piclinic.sql or add the
account manually if needed.
"""

import argparse
import random
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

try:
    import mysql.connector
except ImportError:
    print("ERROR: mysql-connector-python is required.", file=sys.stderr)
    print("       pip install mysql-connector-python --break-system-packages", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_DAYS = 60
NORMAL_DAY_PATIENTS = 20
SURGE_DAY_PATIENTS = 100
# One surge week per this many normal weeks
SURGE_PERIOD_WEEKS = 7

# Arrival window: 08:00 to 14:00 (minutes from midnight)
ARRIVAL_START = 8 * 60
ARRIVAL_END = 14 * 60

# Visit duration range in minutes (for closed visits)
DURATION_MIN = 20
DURATION_MAX = 120

# Small fixed list of common ICD-10 codes for test diagnoses.
# Using real codes so they exist in the icd10 table and work with reports.
COMMON_DIAGNOSES = [
    ("J06.9",  "Acute upper respiratory infection, unspecified"),
    ("A09",    "Infectious gastroenteritis and colitis, unspecified"),
    ("Z00.00", "Encounter for general adult medical examination"),
    ("J18.9",  "Pneumonia, unspecified organism"),
    ("K29.70", "Gastritis, unspecified, without bleeding"),
    ("M54.5",  "Low back pain"),
    ("J02.9",  "Acute pharyngitis, unspecified"),
    ("I10",    "Essential (primary) hypertension"),
    ("E11.9",  "Type 2 diabetes mellitus without complications"),
    ("Z23",    "Encounter for immunization"),
]

VISIT_TYPES = ["Outpatient", "Emergency", "Specialist"]
VISIT_TYPE_WEIGHTS = [0.80, 0.15, 0.05]

COMPLAINTS = [
    "Fiebre y dolor de cabeza",
    "Tos y congestion nasal",
    "Dolor abdominal",
    "Dolor de garganta",
    "Control de presion arterial",
    "Revision general",
    "Diarrea y vomitos",
    "Dolor de espalda",
    "Herida en la piel",
    "Control de diabetes",
    "Vacunacion",
    "Dolor de oido",
]

REFERRAL_SOURCES = [
    "Clinica San Juan",
    "Hospital Regional",
    "Centro de Salud Norte",
    "Puesto de Salud El Carmen",
]

REFERRAL_TARGETS = [
    "Hospital Escuela",
    "Especialista en Cardiologia",
    "Laboratorio Central",
    "Clinica de Maternidad",
]


# ---------------------------------------------------------------------------
# Scenario definitions
# ---------------------------------------------------------------------------

SCENARIOS = [
    # (name, has_complaint, has_vitals, num_diagnoses, has_referral, payment_range)
    ("OPEN_MINIMAL",         False, False, 0, False, (0,    0)),
    ("OPEN_WITH_COMPLAINT",  True,  False, 0, False, (0,    0)),
    ("CLOSED_MINIMAL",       True,  False, 0, False, (0,   50)),
    ("CLOSED_FULL",          True,  True,  2, False, (50, 300)),
    ("CLOSED_WITH_REFERRAL", True,  True,  1, True,  (0,  100)),
]

# Scenarios valid for open visits (today only)
OPEN_SCENARIOS  = [s for s in SCENARIOS if s[0].startswith("OPEN_")]
CLOSED_SCENARIOS = [s for s in SCENARIOS if s[0].startswith("CLOSED_")]


# ---------------------------------------------------------------------------
# Config parsing
# ---------------------------------------------------------------------------

def load_conf(path: Path) -> dict:
    """Parse key=value pairs from piclinic_setup.conf, ignoring comments."""
    conf = {}
    if not path.exists():
        return conf
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r'^([A-Z_]+)=(.*)$', line)
        if m:
            value = m.group(2).strip().strip('"').strip("'")
            conf[m.group(1)] = value
    return conf


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def connect(conf: dict, dry_run: bool):
    if dry_run:
        return None
    return mysql.connector.connect(
        host=conf.get("DB_HOST", "localhost"),
        user=conf.get("DB_ADMIN_USER", "admin"),
        password=conf.get("DB_ADMIN_PASSWORD", ""),
        database="piclinic",
    )


def execute(cursor, sql: str, params: tuple, dry_run: bool):
    if dry_run:
        # Interpolate for display only
        display = sql
        for p in params:
            v = f"'{p}'" if isinstance(p, str) else ("NULL" if p is None else str(p))
            display = display.replace("%s", v, 1)
        print(display + ";")
    else:
        cursor.execute(sql, params)


def load_patients(cursor) -> list:
    cursor.execute("""
        SELECT patientID, clinicPatientID, patientNationalID, familyID,
               lastName, firstName, sex, birthDate,
               homeAddress1, homeAddress2, homeNeighborhood,
               homeCity, homeCounty, homeState,
               contactPhone, contactAltPhone,
               knownAllergies, currentMedications,
               nextVaccinationDate, responsibleParty,
               maritalStatus, profession
        FROM patient
        WHERE active = 1
        ORDER BY patientID
    """)
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def load_medical_staff(cursor) -> list:
    """Return active staff members who are medical professionals."""
    cursor.execute("""
        SELECT username, firstName, lastName, position
        FROM staff
        WHERE active = 1
          AND position IN ('DoctorGeneral','DoctorSpecialist','Nurse',
                           'NursesAid','MedicalStudent','NursingStudent')
        ORDER BY username
    """)
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def get_visit_sequence(cursor, clinic_patient_id: str, visit_date: date) -> int:
    """Return the next sequence number for this patient on this date."""
    cursor.execute("""
        SELECT COUNT(*)
        FROM visit
        WHERE clinicPatientID = %s
          AND DATE(dateTimeIn) = %s
    """, (clinic_patient_id, visit_date.isoformat()))
    count = cursor.fetchone()[0]
    return count + 1


def has_prior_visit(cursor, clinic_patient_id: str, before_date: date) -> bool:
    """Return True if the patient has any visit before before_date."""
    cursor.execute("""
        SELECT COUNT(*)
        FROM visit
        WHERE clinicPatientID = %s
          AND DATE(dateTimeIn) < %s
    """, (clinic_patient_id, before_date.isoformat()))
    return cursor.fetchone()[0] > 0


# ---------------------------------------------------------------------------
# Visit building
# ---------------------------------------------------------------------------

def random_arrival(visit_date: date) -> datetime:
    minutes = random.randint(ARRIVAL_START, ARRIVAL_END)
    return datetime(visit_date.year, visit_date.month, visit_date.day,
                    minutes // 60, minutes % 60, random.randint(0, 59))


def random_close(date_time_in: datetime) -> datetime:
    duration = random.randint(DURATION_MIN, DURATION_MAX)
    return date_time_in + timedelta(minutes=duration)


def build_visit(patient: dict, staff: dict, scenario: tuple,
               visit_date: date, sequence: int,
               first_visit: bool, cursor, dry_run: bool) -> tuple:
    """
    Build and insert a single visit row.
    Returns the patientVisitID.
    """
    name, has_complaint, has_vitals, num_diag, has_referral, pay_range = scenario

    is_open = name.startswith("OPEN_")

    patient_visit_id = f"{patient['patientID']}-{visit_date:%Y%m%d}-{sequence:02d}"
    date_time_in = random_arrival(visit_date)
    date_time_out = None if is_open else random_close(date_time_in)

    visit_type = random.choices(VISIT_TYPES, weights=VISIT_TYPE_WEIGHTS)[0]
    visit_status = "Open" if is_open else "Closed"
    first_visit_flag = "YES" if first_visit else "NO"
    payment = round(random.uniform(*pay_range), 2) if not is_open else 0.00

    primary_complaint = random.choice(COMPLAINTS) if has_complaint else None
    secondary_complaint = random.choice(COMPLAINTS) if has_complaint and random.random() < 0.3 else None

    # Vitals
    height = weight = temp = bp_sys = bp_dia = pulse = None
    height_units = weight_units = temp_units = None
    if has_vitals:
        height = round(random.uniform(145, 185), 1)
        height_units = "cm"
        weight = round(random.uniform(45, 110), 1)
        weight_units = "kg"
        temp = round(random.uniform(36.0, 38.5), 1)
        temp_units = "C"
        bp_sys = random.randint(100, 145)
        bp_dia = random.randint(60, 92)
        pulse = random.randint(58, 102)

    # Diagnoses
    diag1 = cond1 = diag2 = cond2 = diag3 = cond3 = None
    if num_diag >= 1:
        code, desc = random.choice(COMMON_DIAGNOSES)
        diag1 = desc
        cond1 = code
    if num_diag >= 2:
        remaining = [d for d in COMMON_DIAGNOSES if d[0] != cond1]
        code, desc = random.choice(remaining)
        diag2 = desc
        cond2 = code
    # Occasionally add a third diagnosis for realism
    if num_diag >= 2 and random.random() < 0.15:
        remaining2 = [d for d in COMMON_DIAGNOSES if d[0] not in (cond1, cond2)]
        code, desc = random.choice(remaining2)
        diag3 = desc
        cond3 = code

    # Referral
    referred_from = random.choice(REFERRAL_SOURCES) if has_referral else None
    referred_to = random.choice(REFERRAL_TARGETS) if has_referral and random.random() < 0.5 else None

    staff_name = f"{staff['firstName']} {staff['lastName']}"

    sql = """
        INSERT INTO visit (
            patientVisitID, deleted,
            staffUsername, staffName, staffPosition,
            visitType, visitStatus,
            primaryComplaint, secondaryComplaint,
            dateTimeIn, dateTimeOut,
            payment,
            patientID, clinicPatientID, firstVisit,
            patientNationalID, patientFamilyID,
            patientLastName, patientFirstName,
            patientSex, patientBirthDate,
            patientHomeAddress1, patientHomeAddress2,
            patientHomeNeighborhood, patientHomeCity,
            patientHomeCounty, patientHomeState,
            patientContactPhone, patientContactAltPhone,
            patientKnownAllergies, patientCurrentMedications,
            patientNextVaccinationDate,
            patientResponsibleParty, patientMaritalStatus,
            patientProfession,
            height, heightUnits, weight, weightUnits,
            temp, tempUnits,
            bpSystolic, bpDiastolic, pulse,
            diagnosis1, condition1,
            diagnosis2, condition2,
            diagnosis3, condition3,
            referredFrom, referredTo,
            createdDate, modifiedDate
        ) VALUES (
            %s, 0,
            %s, %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s,
            %s, %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s,
            %s, %s,
            %s,
            %s, %s, %s, %s,
            %s, %s,
            %s, %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s
        )
    """

    params = (
        patient_visit_id,
        staff["username"], staff_name, staff["position"],
        visit_type, visit_status,
        primary_complaint, secondary_complaint,
        date_time_in, date_time_out,
        payment,
        patient["patientID"], patient["clinicPatientID"], first_visit_flag,
        patient["patientNationalID"], patient["familyID"],
        patient["lastName"], patient["firstName"],
        patient["sex"], patient["birthDate"],
        patient["homeAddress1"], patient["homeAddress2"],
        patient["homeNeighborhood"], patient["homeCity"],
        patient["homeCounty"], patient["homeState"],
        patient["contactPhone"], patient["contactAltPhone"],
        patient["knownAllergies"], patient["currentMedications"],
        patient["nextVaccinationDate"],
        patient["responsibleParty"], patient["maritalStatus"],
        patient["profession"],
        height, height_units, weight, weight_units,
        temp, temp_units,
        bp_sys, bp_dia, pulse,
        diag1, cond1,
        diag2, cond2,
        diag3, cond3,
        referred_from, referred_to,
        date_time_in, date_time_in,
    )

    execute(cursor, sql, params, dry_run)
    return patient_visit_id


# ---------------------------------------------------------------------------
# Date schedule generation
# ---------------------------------------------------------------------------

def build_schedule(days: int, today: date) -> list:
    """
    Return a list of (visit_date, patient_count) for each working day
    in the window, ending yesterday (no future dates, open visits are
    handled separately for today).

    One surge week (Mon-Fri, ~100 patients/day) is inserted for every
    SURGE_PERIOD_WEEKS of normal weeks.
    """
    # Collect all weekdays in the window, oldest first, stopping before today
    working_days = []
    for offset in range(days, 0, -1):
        d = today - timedelta(days=offset)
        if d.weekday() < 5:  # Mon=0 ... Fri=4
            working_days.append(d)

    # Mark surge weeks: one per SURGE_PERIOD_WEEKS
    # A "week" here is a Mon-Fri block. Build week index for each day.
    schedule = []
    week_boundaries = []
    current_week_start = None
    for d in working_days:
        monday = d - timedelta(days=d.weekday())
        if monday != current_week_start:
            current_week_start = monday
            week_boundaries.append(monday)

    surge_weeks = set()
    for i, wb in enumerate(week_boundaries):
        # Place a surge week at SURGE_PERIOD_WEEKS intervals,
        # not on the first or last week
        if i > 0 and i < len(week_boundaries) - 1:
            if i % SURGE_PERIOD_WEEKS == SURGE_PERIOD_WEEKS // 2:
                surge_weeks.add(wb)

    for d in working_days:
        monday = d - timedelta(days=d.weekday())
        is_surge = monday in surge_weeks
        base_count = SURGE_DAY_PATIENTS if is_surge else NORMAL_DAY_PATIENTS
        # Add some natural variation (+/- 20%)
        variation = int(base_count * random.uniform(-0.2, 0.2))
        count = max(1, base_count + variation)
        schedule.append((d, count))

    return schedule


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Generate test visit records for the piClinic database."
    )
    parser.add_argument(
        "--days", type=int, default=DEFAULT_DAYS,
        help=f"Number of past days to generate visits for (default: {DEFAULT_DAYS})"
    )
    parser.add_argument(
        "--config", type=Path,
        default=Path(__file__).parent / "piclinic_setup.conf",
        help="Path to piclinic_setup.conf"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print SQL statements instead of executing them"
    )
    args = parser.parse_args()

    today = date.today()

    # --- Load config and connect ---
    conf = load_conf(args.config)
    if not conf and not args.dry_run:
        print("WARNING: Could not load piclinic_setup.conf. "
              "Set DB_ADMIN_USER and DB_ADMIN_PASSWORD in environment "
              "or use --dry-run.", file=sys.stderr)

    conn = connect(conf, args.dry_run)
    cursor = None if args.dry_run else conn.cursor()

    # In dry-run mode we need a stub cursor that returns plausible data.
    # For simplicity, dry-run just prints and requires a live DB for
    # sequence queries. Inform the user.
    if args.dry_run:
        print("-- DRY RUN: SQL statements only, not executed.")
        print("-- Note: sequence numbers may not be accurate without a live DB.")
        # Provide minimal stub behaviour for dry-run
        class StubCursor:
            description = []
            def execute(self, *a, **kw): pass
            def fetchall(self): return []
            def fetchone(self): return (0,)
        cursor = StubCursor()
        patients = []  # empty; dry-run will show structure only
        staff_list = []
    else:
        patients = load_patients(cursor)
        staff_list = load_medical_staff(cursor)

    if not patients and not args.dry_run:
        print("ERROR: No active patients found. "
              "Load 100Patients.sql before running this script.", file=sys.stderr)
        sys.exit(1)

    if not staff_list and not args.dry_run:
        print("ERROR: No active medical staff found. "
              "Load TestUsers.sql before running this script.", file=sys.stderr)
        sys.exit(1)

    # --- Build schedule ---
    schedule = build_schedule(args.days, today)
    print(f"-- Generating visits across {len(schedule)} working days "
          f"(window: {args.days} days)", file=sys.stderr)

    # --- Track which patients have been seen, and when ---
    # patient_visit_dates[clinicPatientID] = set of dates seen
    patient_visit_dates: dict = {}
    # Track multi-visit patients: pick 10% of patients up front
    multi_visit_set = set(
        p["clinicPatientID"]
        for p in random.sample(patients, max(1, len(patients) // 10))
    ) if patients else set()

    total_visits = 0
    staff_cycle = 0

    # --- Historical days (closed visits) ---
    for visit_date, target_count in schedule:
        # Build candidate patient list for this day:
        # shuffle patients, skip any already seen on this date
        candidates = [p for p in patients
                      if visit_date not in patient_visit_dates.get(
                          p["clinicPatientID"], set())]
        random.shuffle(candidates)
        day_patients = candidates[:target_count]

        for patient in day_patients:
            cpid = patient["clinicPatientID"]
            patient_visit_dates.setdefault(cpid, set()).add(visit_date)

            # Determine if this is a multi-visit patient's follow-up
            is_multi = cpid in multi_visit_set
            first_visit = cpid not in {k for k, v in patient_visit_dates.items()
                                        if len(v) > 1}
            if not args.dry_run:
                first_visit = not has_prior_visit(cursor, cpid, visit_date)

            scenario = random.choice(CLOSED_SCENARIOS)
            staff = staff_list[staff_cycle % len(staff_list)]
            staff_cycle += 1

            sequence = 1
            if not args.dry_run:
                sequence = get_visit_sequence(cursor, cpid, visit_date)

            build_visit(patient, staff, scenario, visit_date,
                        sequence, first_visit, cursor, args.dry_run)
            total_visits += 1

        if not args.dry_run:
            conn.commit()

    # --- Today: open visits only (small number, as if clinic is mid-day) ---
    if today.weekday() < 5:  # only if today is a weekday
        open_count = random.randint(3, 8)
        today_candidates = [
            p for p in patients
            if today not in patient_visit_dates.get(p["clinicPatientID"], set())
        ]
        random.shuffle(today_candidates)
        today_patients = today_candidates[:open_count]

        for patient in today_patients:
            cpid = patient["clinicPatientID"]
            patient_visit_dates.setdefault(cpid, set()).add(today)

            first_visit = True
            if not args.dry_run:
                first_visit = not has_prior_visit(cursor, cpid, today)

            scenario = random.choice(OPEN_SCENARIOS)
            staff = staff_list[staff_cycle % len(staff_list)]
            staff_cycle += 1

            sequence = 1
            if not args.dry_run:
                sequence = get_visit_sequence(cursor, cpid, today)

            build_visit(patient, staff, scenario, today,
                        sequence, first_visit, cursor, args.dry_run)
            total_visits += 1

        if not args.dry_run:
            conn.commit()

    if not args.dry_run:
        cursor.close()
        conn.close()

    print(f"-- Done. {total_visits} visit records generated.", file=sys.stderr)


if __name__ == "__main__":
    main()
