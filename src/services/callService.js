import { randomUUID } from 'node:crypto';
import { makeCall } from '../models/call.js';
import { makeNote } from '../models/note.js';
import { createDatabase } from '../repositories/database.js';
import { createCallRepository } from '../repositories/callRepository.js';
import { createNoteRepository } from '../repositories/noteRepository.js';
import {
  ValidationError,
  validateCall,
  validateFilters,
  validateNoteContent,
} from '../validation/callValidator.js';

const newestFirst = (a, b) => new Date(b.created_at) - new Date(a.created_at);

export function createCallService(db = createDatabase()) {
  const calls = createCallRepository(db);
  const notes = createNoteRepository(db);

  function getAllCalls(filters = {}) {
    const { valid, errors } = validateFilters(filters);
    if (!valid) throw new ValidationError(errors);

    const { call_type, direction, is_archived = false } = filters;

    return calls
      .findAll()
      .filter((call) => is_archived === 'all' || call.is_archived === is_archived)
      .filter((call) => call_type === undefined || call.call_type === call_type)
      .filter((call) => direction === undefined || call.direction === direction)
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

  function unarchiveCall(id) {
    return calls.update(id, { is_archived: false });
  }

  function addNote(callId, content) {
    const { valid, errors } = validateNoteContent(content);
    if (!valid) throw new ValidationError(errors);

    if (!calls.findById(callId)) return null;

    const note = makeNote({ id: `note-${randomUUID()}`, call_id: callId, content: content.trim() });
    return notes.insert(note);
  }

  function createCall(data) {
    const call = makeCall({ id: randomUUID(), ...data });

    const { valid, errors } = validateCall(call);
    if (!valid) throw new ValidationError(errors);

    if (calls.findById(call.id)) {
      throw new ValidationError([`a call with id ${call.id} already exists`]);
    }

    return calls.insert({
      ...call,
      from: call.from.trim(),
      to: call.to.trim(),
      created_at: new Date(call.created_at).toISOString(),
    });
  }

  function deleteCall(id) {
    const deleted = calls.remove(id);
    if (deleted) notes.removeByCallId(id);

    return deleted;
  }

  return {
    getAllCalls,
    getCallById,
    archiveCall,
    unarchiveCall,
    addNote,
    createCall,
    deleteCall,
  };
}

const service = createCallService();

export const {
  getAllCalls,
  getCallById,
  archiveCall,
  unarchiveCall,
  addNote,
  createCall,
  deleteCall,
} = service;
