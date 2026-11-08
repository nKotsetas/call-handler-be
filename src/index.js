import {
  addNote,
  archiveCall,
  createCall,
  deleteCall,
  getAllCalls,
  getCallById,
  unarchiveCall,
} from './services/callService.js';

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

console.log('\nUnarchiving call 1:');
console.log(unarchiveCall('1'));

console.log('\nAdding a note to call 2:');
console.log(addNote('2', 'Called back, no answer'));
console.dir(getCallById('2'), { depth: null });

console.log('\nMissed calls:');
console.table(getAllCalls({ call_type: 'missed' }));

console.log('\nAll outbound calls, archived ones too:');
console.table(getAllCalls({ direction: 'outbound', is_archived: 'all' }));

console.log('\nArchived calls:');
console.table(getAllCalls({ is_archived: true }));

console.log('\nCreating a call:');
const newCall = createCall({
  direction: 'inbound',
  from: '+33 6 00 00 00 01',
  to: '+33 1 23 45 67 89',
  call_type: 'answered',
  duration: 95,
});
console.log(newCall);

console.log('\nCreating a call with bad data:');
try {
  createCall({ direction: 'sideways', duration: -5 });
} catch (error) {
  console.log(error.errors);
}

console.log(`\nDeleting call ${newCall.id}:`, deleteCall(newCall.id));
console.log('Looking it up again:', getCallById(newCall.id));
