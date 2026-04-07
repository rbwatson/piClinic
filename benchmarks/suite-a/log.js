/**
 * suite-a/log.js
 * Suite A — Log: search and write
 *
 * Data requirements (from seed.sql):
 *   At least one log record must exist from the benchmark seed run.
 *   seed.sql inserts a benchmark log entry for this purpose.
 *
 * Frequency weights (from endpoint-frequency.md):
 *   GET by logDate      : normal=rare, stress=rare
 *   GET by logClass     : normal=rare, stress=rare
 *   GET by sourceModule : normal=rare, stress=rare
 *   POST write entry    : normal=low,  stress=low
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
  { id: 'log_by_date',    resource: 'log', method: 'GET',  variant: 'By log date',     normal: 'rare', stress: 'rare' },
  { id: 'log_by_class',   resource: 'log', method: 'GET',  variant: 'By log class',    normal: 'rare', stress: 'rare' },
  { id: 'log_by_module',  resource: 'log', method: 'GET',  variant: 'By source module',normal: 'rare', stress: 'rare' },
  { id: 'log_write',      resource: 'log', method: 'POST', variant: 'Write log entry', normal: 'low',  stress: 'low'  },
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

// Today's date in YYYY-MM-DD for the date search
const TODAY = new Date().toISOString().slice(0, 10);

function v1(path) { return `${BASE}/api${path}`; }
function v2(path) { return `${BASE}/api/v2${path}`; }

export default function () {
  // GET by logDate
  {
    const url = VER === 'v1'
      ? v1(`/log.php?logDate=${TODAY}`)
      : v2(`/log?logDate=${TODAY}`);
    const r = http.get(url, { headers: auth });
    check(r, { 'log by date 200': (r) => r.status === 200 });
    timing.log_by_date.add(r.timings.duration);
  }

  // GET by logClass
  {
    const url = VER === 'v1'
      ? v1(`/log.php?logClass=info`)
      : v2(`/log?logClass=info`);
    const r = http.get(url, { headers: auth });
    check(r, { 'log by class 200': (r) => r.status === 200 });
    timing.log_by_class.add(r.timings.duration);
  }

  // GET by sourceModule
  {
    const url = VER === 'v1'
      ? v1(`/log.php?sourceModule=benchmark`)
      : v2(`/log?sourceModule=benchmark`);
    const r = http.get(url, { headers: auth });
    check(r, { 'log by module 200': (r) => r.status === 200 });
    timing.log_by_module.add(r.timings.duration);
  }

  // POST write log entry
  {
    const body = JSON.stringify({
      userToken:        TOKEN,
      logClass:         'info',
      sourceModule:     'benchmark',
      logTable:         'log',
      logAction:        'POST',
      logStatusCode:    200,
      logStatusMessage: 'Benchmark log entry',
    });
    const url = VER === 'v1' ? v1(`/log.php`) : v2(`/log`);
    const r = http.post(url, body, { headers: authJson });
    check(r, { 'log write 201': (r) => r.status === POST_OK });
    timing.log_write.add(r.timings.duration);
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
