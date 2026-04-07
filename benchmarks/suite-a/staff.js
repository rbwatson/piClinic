/**
 * suite-a/staff.js
 * Suite A — Staff: lookup and admin operations
 *
 * Data requirements (from seed.sql):
 *   bmtest account must exist (also used for benchmark login)
 *
 * Frequency weights (from endpoint-frequency.md):
 *   GET by username    : normal=rare, stress=rare
 *   GET by last name   : normal=rare, stress=rare
 *   POST create staff  : normal=rare, stress=rare
 *   PATCH update staff : normal=rare, stress=rare
 *   DELETE deactivate  : normal=rare, stress=rare
 */

import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

const BASE   = __ENV.TARGET_BASE_URL || 'http://localhost';
const VER    = __ENV.TARGET_VERSION  || 'v2';
const TOKEN  = __ENV.BENCHMARK_TOKEN       || '';
const UA          = __ENV.BENCHMARK_USER_AGENT  || 'k6-benchmark/1.0';
const AUTH_HEADER = VER === 'v1' ? 'X-Piclinic-Token' : 'X-Session-Token';
const REPEAT  = parseInt(__ENV.REPEAT_COUNT || '5');
const POST_OK = 201;

const CASES = [
  { id: 'staff_by_username', resource: 'staff', method: 'GET',    variant: 'By username',          normal: 'rare', stress: 'rare' },
  { id: 'staff_by_lastname', resource: 'staff', method: 'GET',    variant: 'By last name',         normal: 'rare', stress: 'rare' },
  { id: 'staff_create',      resource: 'staff', method: 'POST',   variant: 'Create staff account', normal: 'rare', stress: 'rare' },
  { id: 'staff_update',      resource: 'staff', method: 'PATCH',  variant: 'Update staff record',  normal: 'rare', stress: 'rare' },
  { id: 'staff_delete',      resource: 'staff', method: 'DELETE', variant: 'Deactivate staff',     normal: 'rare', stress: 'rare' },
];

const timing = {};
for (const c of CASES) { timing[c.id] = new Trend('bm_' + c.id, true); }

export const options = {
  vus: 1,
  iterations: REPEAT,
  thresholds: { checks: ['rate==1.0'] },
};

const auth = {
  [AUTH_HEADER]: TOKEN,
  'Accept': 'application/json',
  'User-Agent': UA,
};
const authJson = Object.assign({}, auth, { 'Content-Type': 'application/json' });

// Password hash for newly created staff account (same as other test accounts)
const TEST_HASH = '$2y$12$XgB7Mo4j7TqLd3sKLpva1OP/pXljsa58U3rIRtuLPOrcxmKOiyDsG';

function v1(path) { return `${BASE}/api${path}`; }
function v2(path) { return `${BASE}/api/v2${path}`; }

let runSeq = 0;

export default function () {
  runSeq++;
  const newUsername = `bm-tmp-${runSeq}-${Date.now()}`;

  // GET by username
  {
    const url = VER === 'v1'
      ? v1(`/staff.php?username=bmtest`)
      : v2(`/staff/bmtest`);
    const r = http.get(url, { headers: auth });
    check(r, { 'staff by username 200': (r) => r.status === 200 });
    timing.staff_by_username.add(r.timings.duration);
  }

  // GET by last name
  {
    const url = VER === 'v1'
      ? v1(`/staff.php?lastName=Test`)
      : v2(`/staff?lastName=Test`);
    const r = http.get(url, { headers: auth });
    check(r, { 'staff by lastname 200': (r) => r.status === 200 });
    timing.staff_by_lastname.add(r.timings.duration);
  }

  // POST create staff account
  {
    const body = JSON.stringify({
      username:      newUsername,
      memberID:      newUsername,
      lastName:      'BenchmarkTmp',
      firstName:     'Temp',
      position:      'ClinicStaff',
      accessGranted: 'ClinicStaff',
      password:      TEST_HASH,
    });
    const url = VER === 'v1' ? v1(`/staff.php`) : v2(`/staff`);
    const r = http.post(url, body, { headers: authJson });
    check(r, { 'staff create 201': (r) => r.status === POST_OK });
    timing.staff_create.add(r.timings.duration);
  }

  // PATCH update staff record
  {
    const body = VER === 'v1'
      ? JSON.stringify({ username: newUsername, contactInfo: 'benchmark-test@example.com' })
      : JSON.stringify({ contactInfo: 'benchmark-test@example.com' });
    const url = VER === 'v1'
      ? v1(`/staff.php`)
      : v2(`/staff/${newUsername}`);
    const r = http.patch(url, body, { headers: authJson });
    check(r, { 'staff update 200': (r) => r.status === 200 });
    timing.staff_update.add(r.timings.duration);
  }

  // DELETE deactivate (clean up)
  {
    const url = VER === 'v1'
      ? v1(`/staff.php?username=${newUsername}`)
      : v2(`/staff/${newUsername}`);
    const r = http.del(url, null, { headers: auth });
    check(r, { 'staff delete 200': (r) => r.status === 200 });
    timing.staff_delete.add(r.timings.duration);
  }
}

export function handleSummary(data) {
  for (const c of (data.root_group?.checks ?? []).filter(c => c.fails > 0)) {
    console.error(`FAIL "${c.name}": ${c.fails}/${c.passes + c.fails} failed`);
  }
  const tests = CASES.map(c => ({
    resource:         c.resource,
    method:           c.method,
    variant:          c.variant,
    response_time_ms: Math.round(data.metrics['bm_' + c.id]?.values?.avg ?? 0),
    frequency_normal: c.normal,
    frequency_stress: c.stress,
  }));
  return { stdout: JSON.stringify(tests) + '\n' };
}
