/**
 * suite-b/session-validate.js
 * Suite B — Infrastructure: session token validation
 *
 * Measures the cost of validating an existing session token, which is
 * called internally by every authenticated API request. Suite B results
 * are reported as raw timing only and are not included in the composite score.
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

const BASE    = __ENV.TARGET_BASE_URL       || 'http://localhost';
const VER     = __ENV.TARGET_VERSION        || 'v2';
const TOKEN   = __ENV.BENCHMARK_TOKEN       || '';
const UA          = __ENV.BENCHMARK_USER_AGENT  || 'k6-benchmark/1.0';
const AUTH_HEADER = VER === 'v1' ? 'X-Piclinic-Token' : 'X-Session-Token';
const REPEAT      = parseInt(__ENV.REPEAT_COUNT || '5');

const v1Url = `${BASE}/api/session.php`;
const v2Url = `${BASE}/api/v2/auth/session`;
const testUrl = VER === 'v1' ? v1Url : v2Url;

const timing = new Trend('bm_session_validate', true);

export const options = {
  vus: 1,
  iterations: REPEAT,
  thresholds: { checks: ['rate==1.0'] },
};

const headers = {
  [AUTH_HEADER]: TOKEN,
  'Accept': 'application/json',
  'User-Agent': UA,
};

export default function () {
  const res = http.get(testUrl, { headers });
  check(res, { 'status 200': (r) => r.status === 200 });
  timing.add(res.timings.duration);
}

export function handleSummary(data) {
  for (const c of (data.root_group?.checks ?? []).filter(c => c.fails > 0)) {
    console.error(`FAIL "${c.name}": ${c.fails}/${c.passes + c.fails} failed`);
  }
  const avg = data.metrics['bm_session_validate']?.values?.avg ?? null;
  const result = {
    suite: 'B',
    id: 'session_validate',
    variant: 'Validate session token',
    response_time_ms: avg !== null ? Math.round(avg) : null,
  };
  return { stdout: JSON.stringify(result) + '\n' };
}
