/**
 * suite-a/patient.js
 * Suite A — Patient: all query variants
 *
 * Data requirements (from seed.sql):
 *   BM-0001  Benchmark, Alpha  TestCity   (primary lookup patient)
 *   BM-0002  Benchmark, Beta   TestCity   (secondary lookup patient)
 *   BM-0003  Testcase,  Gamma  OtherCity  (city/neighborhood search)
 *
 * Frequency weights (from endpoint-frequency.md):
 *   GET by clinic patient ID : normal=high, stress=high
 *   GET by last name          : normal=low,  stress=med
 *   GET by last+first name    : normal=low,  stress=med
 *   GET by city               : normal=low,  stress=low
 *   POST create               : normal=med,  stress=high
 *   PATCH update              : normal=med,  stress=high
 *   DELETE deactivate         : normal=rare, stress=rare
 */

import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

const BASE   = __ENV.TARGET_BASE_URL || 'http://localhost';
const VER    = __ENV.TARGET_VERSION  || 'v2';
const TOKEN  = __ENV.BENCHMARK_TOKEN       || '';
const UA     = __ENV.BENCHMARK_USER_AGENT  || 'k6-benchmark/1.0';
const REPEAT = parseInt(__ENV.REPEAT_COUNT || '5');

const CASES = [
  { id: 'patient_by_id',       resource: 'patient', method: 'GET',    variant: 'By clinic patient ID', normal: 'high', stress: 'high' },
  { id: 'patient_by_lastname', resource: 'patient', method: 'GET',    variant: 'By last name',         normal: 'low',  stress: 'med'  },
  { id: 'patient_by_name',     resource: 'patient', method: 'GET',    variant: 'By last + first name', normal: 'low',  stress: 'med'  },
  { id: 'patient_by_city',     resource: 'patient', method: 'GET',    variant: 'By city',              normal: 'low',  stress: 'low'  },
  { id: 'patient_create',      resource: 'patient', method: 'POST',   variant: 'Create patient',       normal: 'med',  stress: 'high' },
  { id: 'patient_update',      resource: 'patient', method: 'PATCH',  variant: 'Update patient',       normal: 'med',  stress: 'high' },
  { id: 'patient_delete',      resource: 'patient', method: 'DELETE', variant: 'Deactivate patient',   normal: 'rare', stress: 'rare' },
];

const timing = {};
for (const c of CASES) { timing[c.id] = new Trend('bm_' + c.id, true); }

export const options = {
  vus: 1,
  iterations: REPEAT,
  thresholds: { checks: ['rate==1.0'] },
};

const auth = {
  'X-Session-Token': TOKEN,
  'Accept': 'application/json',
  'User-Agent': UA,
};
const authJson = Object.assign({}, auth, { 'Content-Type': 'application/json' });

// Unique suffix per iteration to avoid duplicate-key errors on repeated runs
let runSeq = 0;

function v1(path) { return `${BASE}/api${path}`; }
function v2(path) { return `${BASE}/api/v2${path}`; }

export default function () {
  runSeq++;
  const tag = `BM-T${runSeq}-${Date.now()}`;

  // GET by clinic patient ID
  {
    const url = VER === 'v1'
      ? v1(`/patient.php?clinicPatientID=BM-0001`)
      : v2(`/patients/BM-0001`);
    const r = http.get(url, { headers: auth });
    check(r, { 'patient by id 200': (r) => r.status === 200 });
    timing.patient_by_id.add(r.timings.duration);
  }

  // GET by last name
  {
    const url = VER === 'v1'
      ? v1(`/patient.php?lastName=Benchmark`)
      : v2(`/patients?lastName=Benchmark`);
    const r = http.get(url, { headers: auth });
    check(r, { 'patient by lastname 200': (r) => r.status === 200 });
    timing.patient_by_lastname.add(r.timings.duration);
  }

  // GET by last + first name
  {
    const url = VER === 'v1'
      ? v1(`/patient.php?lastName=Benchmark&firstName=Alpha`)
      : v2(`/patients?lastName=Benchmark&firstName=Alpha`);
    const r = http.get(url, { headers: auth });
    check(r, { 'patient by name 200': (r) => r.status === 200 });
    timing.patient_by_name.add(r.timings.duration);
  }

  // GET by city
  {
    const url = VER === 'v1'
      ? v1(`/patient.php?homeCity=OtherCity`)
      : v2(`/patients?homeCity=OtherCity`);
    const r = http.get(url, { headers: auth });
    check(r, { 'patient by city 200': (r) => r.status === 200 });
    timing.patient_by_city.add(r.timings.duration);
  }

  // POST create
  const createId = `BM-RUN-${tag}`;
  {
    const body = JSON.stringify({
      clinicPatientID: createId,
      lastName:        'BenchmarkRun',
      firstName:       'Temp',
      sex:             'M',
    });
    const url = VER === 'v1' ? v1(`/patient.php`) : v2(`/patients`);
    const r = http.post(url, body, { headers: authJson });
    check(r, { 'patient create 201': (r) => r.status === 201 });
    timing.patient_create.add(r.timings.duration);
  }

  // PATCH update (update the record just created)
  {
    const body = JSON.stringify({ homeCity: 'BenchmarkCity' });
    const url = VER === 'v1'
      ? v1(`/patient.php?clinicPatientID=${createId}`)
      : v2(`/patients/${createId}`);
    const r = VER === 'v1'
      ? http.patch(url, body, { headers: authJson })
      : http.patch(url, body, { headers: authJson });
    check(r, { 'patient update 200': (r) => r.status === 200 });
    timing.patient_update.add(r.timings.duration);
  }

  // DELETE deactivate (clean up the record created above)
  {
    const url = VER === 'v1'
      ? v1(`/patient.php?clinicPatientID=${createId}`)
      : v2(`/patients/${createId}`);
    const r = http.del(url, null, { headers: auth });
    check(r, { 'patient delete 200': (r) => r.status === 200 });
    timing.patient_delete.add(r.timings.duration);
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
