/**
 * suite-a/comment.js
 * Suite A — Comment: search and create
 *
 * Data requirements (from seed.sql):
 *   At least one comment record authored by bmtest must exist.
 *   seed.sql inserts a benchmark comment for this purpose.
 *
 * Frequency weights (from endpoint-frequency.md):
 *   GET by username : normal=low,  stress=low
 *   GET by date     : normal=rare, stress=rare
 *   POST create     : normal=low,  stress=low
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
  { id: 'comment_by_username', resource: 'comment', method: 'GET',  variant: 'By username', normal: 'low',  stress: 'low'  },
  { id: 'comment_by_date',     resource: 'comment', method: 'GET',  variant: 'By date',     normal: 'rare', stress: 'rare' },
  { id: 'comment_create',      resource: 'comment', method: 'POST', variant: 'Create',      normal: 'low',  stress: 'low'  },
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
  // GET by username
  {
    const url = VER === 'v1'
      ? v1(`/comment.php?username=bmtest`)
      : v2(`/comments?username=bmtest`);
    const r = http.get(url, { headers: auth });
    check(r, { 'comment by username 200': (r) => r.status === 200 });
    timing.comment_by_username.add(r.timings.duration);
  }

  // GET by date
  {
    const url = VER === 'v1'
      ? v1(`/comment.php?commentDate=${TODAY}`)
      : v2(`/comments?commentDate=${TODAY}`);
    const r = http.get(url, { headers: auth });
    check(r, { 'comment by date 200': (r) => r.status === 200 });
    timing.comment_by_date.add(r.timings.duration);
  }

  // POST create
  {
    const body = JSON.stringify({
      username:    'bmtest',
      commentText: 'Benchmark test comment',
    });
    const url = VER === 'v1' ? v1(`/comment.php`) : v2(`/comments`);
    const r = http.post(url, body, { headers: authJson });
    check(r, { 'comment create 201': (r) => r.status === POST_OK });
    timing.comment_create.add(r.timings.duration);
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
