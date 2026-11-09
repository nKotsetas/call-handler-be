import { calls, notes } from '../data/index.js';

export function createDatabase() {
  return {
    calls: calls.map((call) => ({ ...call })),
    notes: notes.map((note) => ({ ...note })),
  };
}
