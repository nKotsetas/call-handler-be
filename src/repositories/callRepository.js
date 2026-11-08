export function createCallRepository(db) {
  return {
    findAll() {
      return db.calls.map((call) => ({ ...call }));
    },

    findById(id) {
      const call = db.calls.find((c) => c.id === id);
      return call ? { ...call } : null;
    },

    insert(call) {
      db.calls.push({ ...call });
      return { ...call };
    },

    update(id, changes) {
      const call = db.calls.find((c) => c.id === id);
      if (!call) return null;

      Object.assign(call, changes);
      return { ...call };
    },

    remove(id) {
      const index = db.calls.findIndex((c) => c.id === id);
      if (index === -1) return false;

      db.calls.splice(index, 1);
      return true;
    },
  };
}
