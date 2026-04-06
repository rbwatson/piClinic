/**
 * suite-a/clinic.js
 * Suite A — Clinic: info lookup
 *
 * Data requirements (from seed.sql):
 *   A clinic record must exist (loaded by TestClinics.sql before seed.sql runs)
 *
 * Frequency weights (from endpoint-frequency.md):
 *   GET clinic info (this clinic) : normal=low, stress=low
 *   GET clinic info (by publicID) : normal=rare, stress=rare
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
  { id: 'clinic_this',   resource: 'clinic', method: 'GET', variant: 'This clinic info',    normal: 'low',  stress: 'low'  },
  { id: 'clinic_by_id',  resource: 'clinic', method: 'GET', variant: 'Clinic info by ID',   normal: 'rare', stress: 'rare' },
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

function v1(path) { return `${BASE}/api${path}`; }
function v2(path) { return `${BASE}/api/v2${path}`; }

export default function () {
  // GET this clinic info
  {
    const url = VER === 'v1'
      ? v1(`/clinic.php`)
      : v2(`/clinic?thisClinic=1`);
    const r = http.get(url, { headers: auth });
    check(r, { 'clinic this 200': (r) => r.status === 200 });
    timing.clinic_this.add(r.timings.duration);
  }

  // GET clinic info by publicID (205 = SANTA ELENA, set as ThisClinic in TestClinics.sql)
  {
    const url = VER === 'v1'
      ? v1(`/clinic.php?clinicPublicID=205`)
      : v2(`/clinic?publicID=205`);
    const r = http.get(url, { headers: auth });
    check(r, { 'clinic by id 200': (r) => r.status === 200 });
    timing.clinic_by_id.add(r.timings.duration);
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
