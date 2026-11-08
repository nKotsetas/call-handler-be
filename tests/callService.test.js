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

describe('addNote', () => {
  it('adds a note to the call', () => {
    const note = service.addNote('2', 'Called back, no answer');
    assert.equal(note.call_id, '2');
    assert.equal(note.content, 'Called back, no answer');
    assert.match(note.id, /^note-/);
  });

  it('shows the new note in getCallById', () => {
    const note = service.addNote('1', 'Third note');
    const { notes } = service.getCallById('1');
    assert.equal(notes.length, 3);
    assert.deepEqual(notes.at(-1), note);
  });

  it('trims the content', () => {
    assert.equal(service.addNote('1', '  padded  ').content, 'padded');
  });

  it('gives every note its own id', () => {
    assert.notEqual(service.addNote('1', 'a').id, service.addNote('1', 'b').id);
  });

  it('returns null if the call does not exist', () => {
    assert.equal(service.addNote('999', 'hello'), null);
  });

  it('throws a ValidationError for empty content', () => {
    assert.throws(() => service.addNote('1', '   '), { name: 'ValidationError' });
  });
});

describe('deleteCall', () => {
  it('removes the call and returns true', () => {
    assert.equal(service.deleteCall('1'), true);
    assert.equal(service.getCallById('1'), null);
  });

  it('also removes the notes of the call', () => {
    service.deleteCall('1');
    assert.ok(!db.notes.some((note) => note.call_id === '1'));
    assert.equal(db.notes.length, 5);
  });

  it('returns false if the call does not exist', () => {
    assert.equal(service.deleteCall('999'), false);
  });
});
