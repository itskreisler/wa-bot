const { Buttons } = require('whatsapp-web.js')
const { configEnv } = require('../../helpers/Helpers.cjs')
const { createApi } = require('../../helpers/create.api.cjs')
const API_NEKOBOT = 'https://nekobot.xyz/api'
const defaultTypeNekoBot = 'stats'
module.exports = {
  active: true,
  ExpReg: new RegExp(
    `^/neko(?:@${configEnv.BOT_USERNAME})?(?:\\s+)?(?:(.+))?$|^/neko(?:@${configEnv.BOT_USERNAME})?$`,
    'mis'
  ),
  /**
   *
   *
   * @param {import('whatsapp-web.js').Client} client
   * @param {import('whatsapp-web.js').Message} msg
   */
  async cmd (client, msg, match) {
    const { from } = msg
    const [, type = defaultTypeNekoBot] = match
    console.log({ type })
    // const nekoapi = createApi(API_NEKOBOT)
    // const peticion = await nekoapi.image({ type: 'hyuri' })

    client.sendMessage(from, 'Selecciona una opción')
  }
}
