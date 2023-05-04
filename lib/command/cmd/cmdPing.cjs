const { configEnv } = require('../../helpers/Helpers.cjs')

module.exports = {
  active: true,
  ExpReg: new RegExp(`^/ping(?:@${configEnv.USERNAME_BOT})?$`, 'im'), /* /^\/ping(?:@username_bot)?$/im, */
  async cmd (client, msg) {
    const { from } = msg
    client.sendMessage(from, '*pong*')
  }
}
