export const CALL_DIRECTIONS = ['inbound', 'outbound'];
export const CALL_TYPES = ['answered', 'missed', 'voicemail'];

export function makeCall(data) {
  return {
    id: data.id,
    direction: data.direction,
    from: data.from,
    to: data.to,
    call_type: data.call_type,
    duration: data.duration,
    is_archived: data.is_archived ?? false,
    created_at: data.created_at ?? new Date().toISOString(),
  };
}
