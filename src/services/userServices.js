import { createCallService } from './callService.js';

export function createUserServices() {
  const services = new Map();

  return function getServiceForUser(userId) {
    if (!services.has(userId)) {
      services.set(userId, createCallService());
    }
    return services.get(userId);
  };
}
