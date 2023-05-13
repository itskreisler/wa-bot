const { configEnv } = require('../../helpers/Helpers.cjs')

module.exports = {
  active: true,
  ExpReg: new RegExp(`^/ping(?:@${configEnv.BOT_USERNAME})?$`, 'im'), /* /^\/ping(?:@username_bot)?$/im, */
  async cmd (client, msg) {
    const { from } = msg
    client.sendMessage(from, '*pong*')
  }
}
