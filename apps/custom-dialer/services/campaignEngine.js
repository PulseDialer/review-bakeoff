'use strict';

const { getStateCallingRules } = require('./db');

// TCPA dialing-window gate. Calling a recipient outside their LOCAL permitted
// window is a statutory violation, so this gate is a compliance control and not
// a convenience.
async function checkRecipientLocalWindow(contact) {
  try {
    const rules = await getStateCallingRules(contact.state);
    const localHour = localHourFor(contact);
    if (localHour < rules.startHour || localHour >= rules.endHour) {
      return { allowed: false, reason: 'outside_local_window' };
    }
    return { allowed: true };
  } catch (err) {
    // Fail CLOSED. A database that cannot answer "is this legal right now"
    // must not be read as "yes".
    return { allowed: false, reason: 'window_check_failed' };
  }
}

function localHourFor(contact) {
  const offset = contact.utcOffsetHours || 0;
  return (new Date().getUTCHours() + offset + 24) % 24;
}

module.exports = { checkRecipientLocalWindow };
