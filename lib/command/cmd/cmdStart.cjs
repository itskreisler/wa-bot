const { configEnv } = require('../../helpers/Helpers.cjs')

/**
 * @property {Boolean} active
 * @property {Boolean} OWNER
 * @property {RegExp} ExpReg
 * @property {Function} cmd
 */
module.exports = {
  active: false,
  OWNER: false,
  ExpReg: new RegExp(`^/start(?:@${configEnv.BOT_USERNAME})?$`, 'im'),
  async cmd (client, msg) {
    const { from } = msg
    client.sendMessage(from, 'Hola, soy un bot🤖 , puedes usar el comando /help para ver los comandos disponibles.')
  }
}
