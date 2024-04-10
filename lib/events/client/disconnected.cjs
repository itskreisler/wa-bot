var reInitializeCount = 1;
/**
 *
 * @param {import('../../core/Client.cjs')} client - Cliente de whatsapp-web.js
 * @param {import('whatsapp-web.js').WAState} reason - Mensaje de whatsapp-web.js
 * @returns {Promise<void>}
 */
module.exports = async (client, reason) => {
  console.log('Client was logged out'.red, reason)
  //Just to reinitialize on the first page refresh
  if (reInitializeCount === 1 && reason === 'NAVIGATION') {
    reInitializeCount++;
    client.initialize();
    return;
  }
  //Your code for others' reasons for disconnections
}
