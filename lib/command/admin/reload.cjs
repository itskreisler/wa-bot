const { configEnv } = require('../../helpers/Helpers.cjs')
module.exports = {
  ExpReg: new RegExp(`^/reload(?:@${configEnv.USERNAME_BOT})?(\\s+)(.+)$|^/reload(?:@${configEnv.USERNAME_BOT})?`),
  OWNER: true,
  active: false,
  async cmd (client, message, args) {
    const { chat: { id } } = message

    const [cmd,, arg] = args
    let opcion = 'Comandos, Eventos y Handlers'

    try {
      switch (arg || cmd) {
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

      client.sendMessage(id, `✅ ${opcion} Recargados\n> *Okay!*`, { parse_mode: 'Markdown' })
    } catch (e) {
      client.sendMessage(id, '**Ha ocurrido un error a al recargar el bot!**\n*Mira la consola para más detalles.*')
    }
  }
}
