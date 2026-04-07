/**
 * suite-b/log-write.js
 * Suite B — Infrastructure: write a log entry
 *
 * Measures the cost of writing a log entry, which is called internally by
 * most API operations. Suite B results are raw timing only and are not
 * included in the composite score.
 *
 * Environment variables (set by run-benchmark.sh):
 *   TARGET_BASE_URL   Base URL of the target (e.g. http://192.168.1.10)
 *   TARGET_VERSION    "v1" or "v2"
 *   BENCHMARK_TOKEN   Valid session token obtained at run start
 *   REPEAT_COUNT      Number of iterations (default 5)
 */

import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

const BASE   = __ENV.TARGET_BASE_URL       || 'http://localhost';
const VER    = __ENV.TARGET_VERSION        || 'v2';
const TOKEN  = __ENV.BENCHMARK_TOKEN       || '';
const UA          = __ENV.BENCHMARK_USER_AGENT  || 'k6-benchmark/1.0';
const AUTH_HEADER = VER === 'v1' ? 'X-Piclinic-Token' : 'X-Session-Token';
const REPEAT   = parseInt(__ENV.REPEAT_COUNT || '5');
const POST_OK  = 201;

const v1Url = `${BASE}/api/log.php`;
const v2Url = `${BASE}/api/v2/log`;
const testUrl = VER === 'v1' ? v1Url : v2Url;

const timing = new Trend('bm_log_write', true);

export const options = {
  vus: 1,
  iterations: REPEAT,
  thresholds: { checks: ['rate==1.0'] },
};

const headers = {
  [AUTH_HEADER]: TOKEN,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': UA,
};

const payload = JSON.stringify({
  userToken:        TOKEN,
  logClass:         'benchmark',
  sourceModule:     'suite-b/log-write',
  logTable:         'log',
  logAction:        'POST',
  logStatusCode:    '201',
  logStatusMessage: 'Benchmark log write test',
});

export default function () {
  const res = http.post(testUrl, payload, { headers });
  check(res, { 'status 201': (r) => r.status === POST_OK });
  timing.add(res.timings.duration);
}

export function handleSummary(data) {
  for (const c of (data.root_group?.checks ?? []).filter(c => c.fails > 0)) {
    console.error(`FAIL "${c.name}": ${c.fails}/${c.passes + c.fails} failed`);
  }
  const avg = data.metrics['bm_log_write']?.values?.avg ?? null;
  const result = {
    suite: 'B',
    id: 'log_write',
    variant: 'Write log entry',
    response_time_ms: avg !== null ? Math.round(avg) : null,
  };
  return { stdout: JSON.stringify(result) + '\n' };
}
