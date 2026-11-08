import { createDatabase } from '../repositories/database.js';
import { createCallRepository } from '../repositories/callRepository.js';
import { createNoteRepository } from '../repositories/noteRepository.js';

const newestFirst = (a, b) => new Date(b.created_at) - new Date(a.created_at);

export function createCallService(db = createDatabase()) {
  const calls = createCallRepository(db);
  const notes = createNoteRepository(db);

  function getAllCalls() {
    return calls
      .findAll()
      .filter((call) => !call.is_archived)
      .sort(newestFirst);
  }

  function getCallById(id) {
    const call = calls.findById(id);
    if (!call) return null;

    return { ...call, notes: notes.findByCallId(id) };
  }

  function archiveCall(id) {
    return calls.update(id, { is_archived: true });
  }

  return { getAllCalls, getCallById, archiveCall };
}

const service = createCallService();

export const { getAllCalls, getCallById, archiveCall } = service;
