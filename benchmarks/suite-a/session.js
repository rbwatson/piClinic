/**
 * suite-a/session.js
 * Suite A — Session: login and logout
 *
 * Each iteration logs in with the benchmark account, captures the token,
 * then logs out. The benchmark token used by other suite-a scripts is
 * obtained by run-benchmark.sh before tests run; this script measures the
 * cost of the login/logout operations themselves.
 *
 * Frequency weights (from endpoint-frequency.md):
 *   session POST  (login):  normal=low,  stress=med
 *   session DELETE (logout): normal=low, stress=med
 *
 * Environment variables:
 *   TARGET_BASE_URL       Base URL of the target
 *   TARGET_VERSION        "v1" or "v2"
 *   BENCHMARK_USERNAME    Username of the benchmark test account
 *   BENCHMARK_PASSWORD    Plain-text password of the benchmark test account
 *   REPEAT_COUNT          Number of iterations (default 5)
 */

import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

const BASE     = __ENV.TARGET_BASE_URL      || 'http://localhost';
const VER      = __ENV.TARGET_VERSION       || 'v2';
const USERNAME = __ENV.BENCHMARK_USERNAME   || 'bmtest';
const PASSWORD = __ENV.BENCHMARK_PASSWORD   || '';
const UA          = __ENV.BENCHMARK_USER_AGENT || 'k6-benchmark/1.0';
const AUTH_HEADER = VER === 'v1' ? 'X-Piclinic-Token' : 'X-Session-Token';
const REPEAT      = parseInt(__ENV.REPEAT_COUNT || '5');
const POST_OK     = 201;

const CASES = [
  { id: 'session_login',  resource: 'session', method: 'POST',   variant: 'Login',  normal: 'low', stress: 'med' },
  { id: 'session_logout', resource: 'session', method: 'DELETE', variant: 'Logout', normal: 'low', stress: 'med' },
];

const timing = {};
for (const c of CASES) { timing[c.id] = new Trend('bm_' + c.id, true); }

export const options = {
  vus: 1,
  iterations: REPEAT,
  thresholds: { checks: ['rate==1.0'] },
};

const jsonHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': UA };

function loginUrl() {
  return VER === 'v1'
    ? `${BASE}/api/session.php`
    : `${BASE}/api/v2/auth/login`;
}

function logoutUrl(token) {
  return VER === 'v1'
    ? `${BASE}/api/session.php`
    : `${BASE}/api/v2/auth/logout`;
}

function logoutMethod() {
  return VER === 'v1' ? 'DELETE' : 'POST';
}

export default function () {
  // Login
  const loginBody = JSON.stringify({ username: USERNAME, password: PASSWORD });
  const loginRes  = http.post(loginUrl(), loginBody, { headers: jsonHeaders });
  const loginOk   = check(loginRes, { 'login status 201': (r) => r.status === POST_OK });
  timing.session_login.add(loginRes.timings.duration);

  if (!loginOk) { return; }

  const token = loginRes.json('data.token');
  const authHeaders = {
    [AUTH_HEADER]: token,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Logout
  const logoutBody = JSON.stringify({ token });
  let logoutRes;
  if (logoutMethod() === 'DELETE') {
    logoutRes = http.del(logoutUrl(token), logoutBody, { headers: authHeaders });
  } else {
    logoutRes = http.post(logoutUrl(token), logoutBody, { headers: authHeaders });
  }
  check(logoutRes, { 'logout status 200': (r) => r.status === 200 || r.status === 204 });
  timing.session_logout.add(logoutRes.timings.duration);
}

export function handleSummary(data) {
  for (const c of (data.root_group?.checks ?? []).filter(c => c.fails > 0)) {
    console.error(`FAIL "${c.name}": ${c.fails}/${c.passes + c.fails} failed`);
  }
  const tests = CASES.map(c => ({
    resource:        c.resource,
    method:          c.method,
    variant:         c.variant,
    response_time_ms: Math.round(data.metrics['bm_' + c.id]?.values?.avg ?? 0),
    frequency_normal: c.normal,
    frequency_stress: c.stress,
  }));
  return { stdout: JSON.stringify(tests) + '\n' };
}
