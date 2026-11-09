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

describe('GET /calls with filters', () => {
  it('filters by call_type and direction', async () => {
    const res = await request('/calls?call_type=missed&direction=inbound');
    assert.equal(res.status, 200);
    assert.deepEqual(ids(res.body.calls), ['5']);
  });

  it('returns archived calls with is_archived=true', async () => {
    const res = await request('/calls?is_archived=true');
    assert.deepEqual(ids(res.body.calls), ['3', '8', '11']);
  });

  it('returns all calls with is_archived=all', async () => {
    const res = await request('/calls?is_archived=all');
    assert.equal(res.body.calls.length, 12);
  });

  it('returns 400 for a wrong filter value', async () => {
    const res = await request('/calls?call_type=busy');
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.details, ['call_type must be one of: answered, missed, voicemail']);
  });

  it('returns 400 if a filter is given twice', async () => {
    const res = await request('/calls?direction=inbound&direction=outbound');
    assert.equal(res.status, 400);
  });
});

describe('PATCH /calls/:callId/unarchive', () => {
  it('puts the call back in GET /calls', async () => {
    const user = newUser();
    const res = await request('/calls/3/unarchive', { method: 'PATCH', user });
    assert.equal(res.status, 200);
    assert.equal(res.body.is_archived, false);

    const list = await request('/calls', { user });
    assert.ok(ids(list.body.calls).includes('3'));
  });

  it('returns 404 if the call does not exist', async () => {
    const res = await request('/calls/999/unarchive', { method: 'PATCH' });
    assert.equal(res.status, 404);
  });
});

describe('POST /calls/:callId/notes', () => {
  it('adds a note that shows up in the call details', async () => {
    const user = newUser();
    const res = await request('/calls/2/notes', {
      method: 'POST',
      user,
      body: { content: 'Called back, no answer' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.call_id, '2');

    const call = await request('/calls/2', { user });
    assert.deepEqual(call.body.notes, [res.body]);
  });

  it('returns 400 for empty content', async () => {
    const res = await request('/calls/2/notes', { method: 'POST', body: { content: '  ' } });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.details, ['content must be a non-empty string']);
  });

  it('returns 400 without a body', async () => {
    const res = await request('/calls/2/notes', { method: 'POST' });
    assert.equal(res.status, 400);
  });

  it('returns 400 for invalid json', async () => {
    const res = await request('/calls/2/notes', { method: 'POST', body: '{"content":' });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'Request body must be valid JSON' });
  });

  it('returns 404 if the call does not exist', async () => {
    const res = await request('/calls/999/notes', { method: 'POST', body: { content: 'hi' } });
    assert.equal(res.status, 404);
  });
});

describe('POST /calls', () => {
  const newCall = {
    direction: 'outbound',
    from: '+33 1 23 45 67 89',
    to: '+33 6 55 55 55 55',
    call_type: 'answered',
    duration: 75,
  };

  it('creates a call that shows up first in GET /calls', async () => {
    const user = newUser();
    const res = await request('/calls', { method: 'POST', user, body: newCall });
    assert.equal(res.status, 201);
    assert.equal(res.body.is_archived, false);

    const list = await request('/calls', { user });
    assert.equal(list.body.calls[0].id, res.body.id);
  });

  it('returns 400 with all the validation errors', async () => {
    const res = await request('/calls', {
      method: 'POST',
      body: { ...newCall, direction: 'sideways', duration: -1 },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.details, [
      'direction must be one of: inbound, outbound',
      'duration must be a non-negative integer (seconds)',
    ]);
  });

  it('returns 400 for an array body', async () => {
    const res = await request('/calls', { method: 'POST', body: [newCall] });
    assert.equal(res.status, 400);
  });

  it('returns 400 without a body', async () => {
    const res = await request('/calls', { method: 'POST' });
    assert.equal(res.status, 400);
  });

  it('returns 400 if the id already exists', async () => {
    const res = await request('/calls', { method: 'POST', body: { ...newCall, id: '1' } });
    assert.equal(res.status, 400);
  });
});

describe('DELETE /calls/:callId', () => {
  it('deletes the call', async () => {
    const user = newUser();
    const res = await request('/calls/1', { method: 'DELETE', user });
    assert.equal(res.status, 204);

    const call = await request('/calls/1', { user });
    assert.equal(call.status, 404);
  });

  it('returns 404 if the call does not exist', async () => {
    const res = await request('/calls/999', { method: 'DELETE' });
    assert.equal(res.status, 404);
  });
});
