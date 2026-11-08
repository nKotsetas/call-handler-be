import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createUserServices } from '../src/services/userServices.js';

describe('createUserServices', () => {
  it('returns the same service for the same user', () => {
    const getServiceForUser = createUserServices();
    assert.equal(getServiceForUser('a'), getServiceForUser('a'));
  });

  it('keeps the data of each user separate', () => {
    const getServiceForUser = createUserServices();
    getServiceForUser('a').archiveCall('1');
    assert.equal(getServiceForUser('b').getCallById('1').is_archived, false);
  });
});
