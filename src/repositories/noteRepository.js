export function createNoteRepository(db) {
  return {
    findByCallId(callId) {
      return db.notes.filter((note) => note.call_id === callId).map((note) => ({ ...note }));
    },

    insert(note) {
      db.notes.push({ ...note });
      return { ...note };
    },

    removeByCallId(callId) {
      db.notes = db.notes.filter((note) => note.call_id !== callId);
    },
  };
}
