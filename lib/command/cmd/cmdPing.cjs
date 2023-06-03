const { configEnv: { BOT_USERNAME } } = require('../../helpers/Helpers.cjs')

module.exports = {
  active: true,
  ExpReg: new RegExp(`^/ping(?:@${BOT_USERNAME})?$`, 'im'), /* /^\/ping(?:@username_bot)?$/im, */
  /**
   * Logica del comando
   *
   * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   */
  async cmd (client, msg) {
    const { from } = msg
    client.sendMessage(from, '*pong*')
  }
}
