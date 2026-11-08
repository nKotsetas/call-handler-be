export function makeNote(data) {
  return {
    id: data.id,
    call_id: data.call_id,
    content: data.content,
  };
}
