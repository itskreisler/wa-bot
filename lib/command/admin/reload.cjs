const { configEnv: { BOT_USERNAME } } = require('../../helpers/Helpers.cjs')
module.exports = {
  ExpReg: new RegExp(`^/reload(?:@${BOT_USERNAME})?(?:\\s+(.+))?$`, 'ims'),
  OWNER: true,
  active: true,
  /**
   * Logica del comando
   *
   * @param {import('../../core/Client.cjs')} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   * @param {RegExpMatchArray} match - Resultado de la expresion regular
   */
  async cmd(client, msg, match) {
    const chat = await msg.getChat()
    const { id: { _serialized } } = chat
    const [, arg] = match
    let opcion = 'Comandos, Eventos y Handlers'

    try {
      switch (arg) {
        case 'comands':
        case 'comandos':
          opcion = 'Comandos'
          await client.loadCommands()
          break
        case 'eventos':
        case 'events':
          opcion = 'Eventos'
          await client.loadEvents()
          break

        case 'handlers':
          opcion = 'Handlers'
          await client.loadHandlers()
          break

        default:
          await client.loadEvents()
          await client.loadHandlers()
          await client.loadCommands()

          break
      }

      client.sendMessage(_serialized, `✅ ${opcion} Recargados\n> *Okay!*`)
    } catch (e) {
      client.sendMessage(_serialized, '**Ha ocurrido un error a al recargar el bot!**\n*Mira la consola para más detalles.*')
    }
  }
}
