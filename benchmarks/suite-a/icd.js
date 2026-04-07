/**
 * suite-a/icd.js
 * Suite A — ICD-10: lookup variants
 *
 * Data requirements:
 *   icd10 table must contain A00.0 and at least one Z00.x record.
 *   These are verified by seed.sql and are part of the full icd10 table
 *   loaded during initial system setup. The benchmark does not modify
 *   the icd10 table.
 *
 * Frequency weights (from endpoint-frequency.md):
 *   GET by diagnosis code  : normal=low,  stress=med
 *   GET by description     : normal=med,  stress=high
 *   GET by index           : normal=low,  stress=low
 *   PATCH update ICD record: normal=rare, stress=rare
 */

import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

const BASE   = __ENV.TARGET_BASE_URL || 'http://localhost';
const VER    = __ENV.TARGET_VERSION  || 'v2';
const TOKEN  = __ENV.BENCHMARK_TOKEN       || '';
const UA          = __ENV.BENCHMARK_USER_AGENT  || 'k6-benchmark/1.0';
const AUTH_HEADER = VER === 'v1' ? 'X-Piclinic-Token' : 'X-Session-Token';
const REPEAT = parseInt(__ENV.REPEAT_COUNT || '5');

const CASES = [
  { id: 'icd_by_code',   resource: 'icd', method: 'GET',   variant: 'By diagnosis code',  normal: 'low',  stress: 'med'  },
  { id: 'icd_by_desc',   resource: 'icd', method: 'GET',   variant: 'By description',     normal: 'med',  stress: 'high' },
  { id: 'icd_by_index',  resource: 'icd', method: 'GET',   variant: 'By index',           normal: 'low',  stress: 'low'  },
  { id: 'icd_update',    resource: 'icd', method: 'PATCH', variant: 'Update ICD record',  normal: 'rare', stress: 'rare' },
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

function v1(path) { return `${BASE}/api${path}`; }
function v2(path) { return `${BASE}/api/v2${path}`; }

export default function () {
  // GET by diagnosis code (exact match)
  {
    const url = VER === 'v1'
      ? v1(`/icd.php?q=A00.0`)
      : v2(`/icd/A00.0`);
    const r = http.get(url, { headers: auth });
    check(r, { 'icd by code 200': (r) => r.status === 200 });
    timing.icd_by_code.add(r.timings.duration);
  }

  // GET by description (text search — autocomplete during visit entry)
  {
    const url = VER === 'v1'
      ? v1(`/icd.php?t=Cholera`)
      : v2(`/icd?q=Cholera`);
    const r = http.get(url, { headers: auth });
    check(r, { 'icd by desc 200': (r) => r.status === 200 });
    timing.icd_by_desc.add(r.timings.duration);
  }

  // GET by index (prefix search)
  {
    const url = VER === 'v1'
      ? v1(`/icd.php?qs=Z00`)
      : v2(`/icd?q=Z00`);
    const r = http.get(url, { headers: auth });
    check(r, { 'icd by index 200': (r) => r.status === 200 });
    timing.icd_by_index.add(r.timings.duration);
  }

  // PATCH update ICD record — v1 only; not implemented in v2
  if (VER === 'v1') {
    const body = JSON.stringify({ shortDescription: 'Cholera due to Vibrio cholerae 01 biovar cholerae' });
    const url = v1(`/icd.php?icd10index=A000&language=en`);
    const r = http.patch(url, body, { headers: authJson });
    check(r, { 'icd update 200': (r) => r.status === 200 });
    timing.icd_update.add(r.timings.duration);
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
