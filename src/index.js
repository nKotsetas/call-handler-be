import { archiveCall, getAllCalls, getCallById } from './services/callService.js';

console.log('All active calls:');
console.table(getAllCalls());

console.log('\nCall 1 with notes:');
console.dir(getCallById('1'), { depth: null });

console.log('\nCall that does not exist:', getCallById('999'));

console.log('\nArchiving call 1:');
console.log(archiveCall('1'));

console.log('\nActive calls after archiving:');
console.table(getAllCalls());

console.log('\nArchiving a call that does not exist:', archiveCall('999'));
