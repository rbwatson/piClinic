/**
 * suite-a/visit.js
 * Suite A — Visit: all query variants
 *
 * Data requirements (from seed.sql):
 *   BMV-0001  visitID=999001  BM-0001  Open    (dashboard open-visit list)
 *   BMV-0002  visitID=999002  BM-0001  Closed  (patient visit history)
 *   BMV-0003  visitID=999003  BM-0002  Open    (by patientVisitID)
 *   BM-0001 patient must exist
 *   BM-0002 patient must exist
 *
 * Frequency weights (from endpoint-frequency.md):
 *   GET open visits list (dashboard) : normal=high, stress=high
 *   GET by visit ID                  : normal=med,  stress=high
 *   GET by patient visit ID          : normal=med,  stress=high
 *   GET patient visit history        : normal=med,  stress=high
 *   POST open visit                  : normal=med,  stress=high
 *   PATCH update visit               : normal=med,  stress=high
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
  { id: 'visit_open_list',   resource: 'visit', method: 'GET',   variant: 'Open visits list (dashboard)', normal: 'high', stress: 'high' },
  { id: 'visit_by_id',       resource: 'visit', method: 'GET',   variant: 'By visit ID',                  normal: 'med',  stress: 'high' },
  { id: 'visit_by_pvid',     resource: 'visit', method: 'GET',   variant: 'By patient visit ID',          normal: 'med',  stress: 'high' },
  { id: 'visit_history',     resource: 'visit', method: 'GET',   variant: 'Patient visit history',        normal: 'med',  stress: 'high' },
  { id: 'visit_open',        resource: 'visit', method: 'POST',  variant: 'Open visit',                   normal: 'med',  stress: 'high' },
  { id: 'visit_update',      resource: 'visit', method: 'PATCH', variant: 'Update visit',                 normal: 'med',  stress: 'high' },
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

function v1(path) { return `${BASE}/api${path}`; }
function v2(path) { return `${BASE}/api/v2${path}`; }

export default function () {
  // GET open visits list (dashboard)
  {
    const url = VER === 'v1'
      ? v1(`/visit.php?visitStatus=Open`)
      : v2(`/visits?visitStatus=Open`);
    const r = http.get(url, { headers: auth });
    check(r, { 'visit open list 200': (r) => r.status === 200 });
    timing.visit_open_list.add(r.timings.duration);
  }

  // GET by visit ID (integer visitID in v1; patientVisitID path in v2)
  {
    const url = VER === 'v1'
      ? v1(`/visit.php?visitID=999001`)
      : v2(`/visits/BMV-0001`);
    const r = http.get(url, { headers: auth });
    check(r, { 'visit by id 200': (r) => r.status === 200 });
    timing.visit_by_id.add(r.timings.duration);
  }

  // GET by patient visit ID (patientVisitID in both v1 and v2)
  {
    const url = VER === 'v1'
      ? v1(`/visit.php?patientVisitID=BMV-0003`)
      : v2(`/visits/BMV-0003`);
    const r = http.get(url, { headers: auth });
    check(r, { 'visit by pvid 200': (r) => r.status === 200 });
    timing.visit_by_pvid.add(r.timings.duration);
  }

  // GET patient visit history
  {
    const url = VER === 'v1'
      ? v1(`/visit.php?clinicPatientID=BM-0001`)
      : v2(`/visits?clinicPatientID=BM-0001`);
    const r = http.get(url, { headers: auth });
    check(r, { 'visit history 200': (r) => r.status === 200 });
    timing.visit_history.add(r.timings.duration);
  }

  // POST open visit (creates a new visit for BM-0001; captured for update)
  let newVisitId = null;
  {
    const body = JSON.stringify({
      clinicPatientID: 'BM-0001',
      visitType:       'Clinic',
    });
    const url = VER === 'v1' ? v1(`/visit.php`) : v2(`/visits`);
    const r = http.post(url, body, { headers: authJson });
    check(r, { 'visit open 201': (r) => r.status === 201 });
    timing.visit_open.add(r.timings.duration);
    // Capture created visit ID for the update step
    newVisitId = VER === 'v1'
      ? (r.json('data.patientVisitID') || r.json('data.visitID'))
      : r.json('data.patientVisitID');
  }

  // PATCH update visit (update the visit just opened)
  if (newVisitId) {
    const body = JSON.stringify({ primaryComplaint: 'Benchmark test complaint' });
    const url = VER === 'v1'
      ? v1(`/visit.php?patientVisitID=${newVisitId}`)
      : v2(`/visits/${newVisitId}`);
    const r = http.patch(url, body, { headers: authJson });
    check(r, { 'visit update 200': (r) => r.status === 200 });
    timing.visit_update.add(r.timings.duration);
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
