const { configEnv: { BOT_USERNAME } } = require('../../helpers/Helpers.cjs')

module.exports = {
  active: true,
  ExpReg: new RegExp(`^/ping(?:@${BOT_USERNAME})?$`, 'im'), /* /^\/ping(?:@username_bot)?$/im, */
  /**
   *
   *
   * @param {import('whatsapp-web.js').Client} client
   * @param {import('whatsapp-web.js').Message} msg
   */
  async cmd (client, msg) {
    const { from } = msg
    client.sendMessage(from, '*pong*')
  }
}
