import { CALL_DIRECTIONS, CALL_TYPES } from '../models/call.js';

export const NOTE_MAX_LENGTH = 1000;

const PHONE_REGEX = /^\+?[0-9][0-9 ().-]{3,24}$/;

export class ValidationError extends Error {
  constructor(errors) {
    super(`Invalid data: ${errors.join('; ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function result(errors) {
  return { valid: errors.length === 0, errors };
}

export function validateCall(call) {
  if (!isObject(call)) return result(['call must be an object']);

  const errors = [];

  if (call.id !== undefined && (typeof call.id !== 'string' || call.id.trim() === '')) {
    errors.push('id must be a non-empty string');
  }

  if (!CALL_DIRECTIONS.includes(call.direction)) {
    errors.push(`direction must be one of: ${CALL_DIRECTIONS.join(', ')}`);
  }

  for (const field of ['from', 'to']) {
    if (typeof call[field] !== 'string' || !PHONE_REGEX.test(call[field].trim())) {
      errors.push(`${field} must be a valid phone number`);
    }
  }

  if (!CALL_TYPES.includes(call.call_type)) {
    errors.push(`call_type must be one of: ${CALL_TYPES.join(', ')}`);
  }

  if (!Number.isInteger(call.duration) || call.duration < 0) {
    errors.push('duration must be a non-negative integer (seconds)');
  } else if (call.call_type === 'missed' && call.duration !== 0) {
    errors.push('duration must be 0 for a missed call');
  }

  if (call.is_archived !== undefined && typeof call.is_archived !== 'boolean') {
    errors.push('is_archived must be a boolean');
  }

  if (typeof call.created_at !== 'string' || Number.isNaN(Date.parse(call.created_at))) {
    errors.push('created_at must be a valid date');
  }

  return result(errors);
}

export function validateFilters(filters) {
  if (!isObject(filters)) return result(['filters must be an object']);

  const { call_type, direction, is_archived } = filters;
  const errors = [];

  if (call_type !== undefined && !CALL_TYPES.includes(call_type)) {
    errors.push(`call_type must be one of: ${CALL_TYPES.join(', ')}`);
  }
  if (direction !== undefined && !CALL_DIRECTIONS.includes(direction)) {
    errors.push(`direction must be one of: ${CALL_DIRECTIONS.join(', ')}`);
  }
  if (is_archived !== undefined && typeof is_archived !== 'boolean' && is_archived !== 'all') {
    errors.push("is_archived must be true, false or 'all'");
  }

  return result(errors);
}

export function validateNoteContent(content) {
  if (typeof content !== 'string' || content.trim() === '') {
    return result(['content must be a non-empty string']);
  }
  if (content.length > NOTE_MAX_LENGTH) {
    return result([`content must be at most ${NOTE_MAX_LENGTH} characters`]);
  }
  return result([]);
}
