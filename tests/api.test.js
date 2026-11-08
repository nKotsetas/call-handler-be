import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/http/app.js';

let server;
let baseUrl;
let userCount = 0;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

function newUser() {
  userCount++;
  return `test-user-${userCount}`;
}

async function request(path, { method = 'GET', user = newUser(), body, headers = {} } = {}) {
  if (user) headers['X-User-Id'] = user;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(baseUrl + path, {
    method,
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

const ids = (calls) => calls.map((call) => call.id);

describe('GET /health', () => {
  it('works without X-User-Id', async () => {
    const res = await request('/health', { user: null });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });
});

describe('X-User-Id header', () => {
  it('is required', async () => {
    const res = await request('/calls', { user: null });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /Missing X-User-Id/);
  });

  it('can not be blank', async () => {
    const res = await request('/calls', { user: '   ' });
    assert.equal(res.status, 400);
  });

  it('gives each user their own data', async () => {
    const alice = newUser();
    const bob = newUser();
    await request('/calls/1/archive', { method: 'PATCH', user: alice });

    const aliceCalls = await request('/calls', { user: alice });
    const bobCalls = await request('/calls', { user: bob });
    assert.ok(!ids(aliceCalls.body.calls).includes('1'));
    assert.ok(ids(bobCalls.body.calls).includes('1'));
  });
});

describe('GET /calls', () => {
  it('returns the active calls, newest first', async () => {
    const res = await request('/calls');
    assert.equal(res.status, 200);
    assert.equal(res.body.calls.length, 9);
    assert.equal(res.body.calls[0].id, '12');
  });

  it('allows requests from other origins', async () => {
    const res = await request('/calls', { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });
});

describe('GET /calls/:callId', () => {
  it('returns the call with its notes', async () => {
    const res = await request('/calls/1');
    assert.equal(res.status, 200);
    assert.equal(res.body.id, '1');
    assert.equal(res.body.notes.length, 2);
  });

  it('returns 404 if the call does not exist', async () => {
    const res = await request('/calls/999');
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'Call not found' });
  });
});

describe('PATCH /calls/:callId/archive', () => {
  it('archives the call', async () => {
    const user = newUser();
    const res = await request('/calls/1/archive', { method: 'PATCH', user });
    assert.equal(res.status, 200);
    assert.equal(res.body.is_archived, true);

    const list = await request('/calls', { user });
    assert.ok(!ids(list.body.calls).includes('1'));
  });

  it('returns 404 if the call does not exist', async () => {
    const res = await request('/calls/999/archive', { method: 'PATCH' });
    assert.equal(res.status, 404);
  });
});

describe('unknown routes', () => {
  it('return 404', async () => {
    const res = await request('/nope');
    assert.equal(res.status, 404);
  });
});
