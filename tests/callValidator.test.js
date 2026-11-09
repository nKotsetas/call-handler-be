import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calls } from '../src/data/index.js';
import {
  validateCall,
  validateFilters,
  validateNoteContent,
} from '../src/validation/callValidator.js';

const validCall = {
  id: '100',
  direction: 'inbound',
  from: '+33 6 12 34 56 78',
  to: '+33 1 23 45 67 89',
  call_type: 'answered',
  duration: 60,
  is_archived: false,
  created_at: '2025-04-10T14:32:00Z',
};

describe('validateCall', () => {
  it('accepts a valid call', () => {
    assert.deepEqual(validateCall(validCall), { valid: true, errors: [] });
  });

  it('accepts all the seed calls', () => {
    for (const call of calls) {
      assert.deepEqual(validateCall(call).errors, [], `call ${call.id}`);
    }
  });

  it('accepts a call without id and is_archived', () => {
    const { id: _id, is_archived: _archived, ...call } = validCall;
    assert.equal(validateCall(call).valid, true);
  });

  it('rejects things that are not objects', () => {
    assert.equal(validateCall(null).valid, false);
    assert.equal(validateCall([]).valid, false);
    assert.equal(validateCall('call').valid, false);
  });

  it('rejects a wrong direction', () => {
    const { errors } = validateCall({ ...validCall, direction: 'sideways' });
    assert.deepEqual(errors, ['direction must be one of: inbound, outbound']);
  });

  it('rejects a wrong call_type', () => {
    assert.equal(validateCall({ ...validCall, call_type: 'busy' }).valid, false);
  });

  it('rejects bad phone numbers', () => {
    const { errors } = validateCall({ ...validCall, from: 'hello', to: 42 });
    assert.deepEqual(errors, [
      'from must be a valid phone number',
      'to must be a valid phone number',
    ]);
  });

  it('rejects a bad duration', () => {
    assert.equal(validateCall({ ...validCall, duration: -1 }).valid, false);
    assert.equal(validateCall({ ...validCall, duration: 1.5 }).valid, false);
    assert.equal(validateCall({ ...validCall, duration: '60' }).valid, false);
  });

  it('rejects a missed call that has a duration', () => {
    const { errors } = validateCall({ ...validCall, call_type: 'missed', duration: 10 });
    assert.deepEqual(errors, ['duration must be 0 for a missed call']);
  });

  it('rejects is_archived that is not a boolean', () => {
    assert.equal(validateCall({ ...validCall, is_archived: 'no' }).valid, false);
  });

  it('rejects a bad created_at', () => {
    assert.equal(validateCall({ ...validCall, created_at: 'yesterday' }).valid, false);
  });

  it('returns all the errors at once', () => {
    assert.equal(validateCall({}).errors.length, 6);
  });
});

describe('validateNoteContent', () => {
  it('accepts normal text', () => {
    assert.equal(validateNoteContent('Call back tomorrow').valid, true);
  });

  it('rejects empty content', () => {
    assert.equal(validateNoteContent('').valid, false);
    assert.equal(validateNoteContent('   ').valid, false);
    assert.equal(validateNoteContent(undefined).valid, false);
  });

  it('rejects content that is too long', () => {
    assert.equal(validateNoteContent('a'.repeat(1001)).valid, false);
  });
});

describe('validateFilters', () => {
  it('accepts no filters', () => {
    assert.equal(validateFilters({}).valid, true);
  });

  it('accepts valid filters', () => {
    const filters = { call_type: 'missed', direction: 'inbound', is_archived: 'all' };
    assert.equal(validateFilters(filters).valid, true);
  });

  it('rejects wrong values', () => {
    const { errors } = validateFilters({ call_type: 'x', direction: 'y', is_archived: 'z' });
    assert.equal(errors.length, 3);
  });
});
