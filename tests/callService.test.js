import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { createDatabase } from '../src/repositories/database.js';
import { createCallService } from '../src/services/callService.js';

let db;
let service;

beforeEach(() => {
  db = createDatabase();
  service = createCallService(db);
});

describe('getAllCalls', () => {
  it('returns only calls that are not archived', () => {
    const calls = service.getAllCalls();
    assert.equal(calls.length, 9);
    assert.ok(calls.every((call) => !call.is_archived));
  });

  it('returns the newest calls first', () => {
    const ids = service.getAllCalls().map((call) => call.id);
    assert.deepEqual(ids, ['12', '10', '9', '6', '5', '2', '1', '4', '7']);
  });

  it('returns copies so the store can not be changed from outside', () => {
    const [first] = service.getAllCalls();
    first.is_archived = true;
    assert.equal(service.getCallById(first.id).is_archived, false);
  });
});

describe('getCallById', () => {
  it('returns the call with its notes', () => {
    const call = service.getCallById('1');
    assert.equal(call.id, '1');
    assert.deepEqual(
      call.notes.map((note) => note.id),
      ['note-2', 'note-3'],
    );
  });

  it('returns an empty notes array if the call has no notes', () => {
    assert.deepEqual(service.getCallById('2').notes, []);
  });

  it('also finds archived calls', () => {
    assert.equal(service.getCallById('3').is_archived, true);
  });

  it('returns null if the call does not exist', () => {
    assert.equal(service.getCallById('999'), null);
  });
});

describe('archiveCall', () => {
  it('sets is_archived to true and returns the call', () => {
    const call = service.archiveCall('1');
    assert.equal(call.id, '1');
    assert.equal(call.is_archived, true);
  });

  it('removes the call from getAllCalls', () => {
    service.archiveCall('1');
    assert.ok(!service.getAllCalls().some((call) => call.id === '1'));
  });

  it('does not change the other fields', () => {
    const { notes: _notes, ...before } = service.getCallById('1');
    assert.deepEqual(service.archiveCall('1'), { ...before, is_archived: true });
  });

  it('returns null if the call does not exist', () => {
    assert.equal(service.archiveCall('999'), null);
  });
});

describe('unarchiveCall', () => {
  it('sets is_archived back to false', () => {
    assert.equal(service.unarchiveCall('3').is_archived, false);
  });

  it('puts the call back in getAllCalls', () => {
    service.archiveCall('1');
    service.unarchiveCall('1');
    assert.ok(service.getAllCalls().some((call) => call.id === '1'));
  });

  it('returns null if the call does not exist', () => {
    assert.equal(service.unarchiveCall('999'), null);
  });
});
