const { owners, ownersId, configEnv: { BOT_PREFIX } } = require('../../helpers/Helpers.cjs')
/**
 *
 * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
 * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
 * @returns {Promise<void>}
 */
module.exports = async (client, msg) => {
  const { body, from, author } = msg
  if (!body.startsWith(BOT_PREFIX)) return
  const [existe, [ExpReg, comando]] = client.findCommand(body)
  if (existe) {
    if (comando.OWNER) {
      const chat = await msg.getChat()
      const usuarioId = Number(chat.isGroup ? author.split('@').shift() : from.split('@').shift())
      if (!ownersId.includes(usuarioId)) {
        return await client.sendMessage(
          from,
          '❌ *Solo los dueños de este bot pueden ejecutar este comando*\n'
        )
      }
    }
    try {
      comando.cmd(client, msg, body.match(ExpReg))
    } catch (e) {
      console.log({ e })
      client.sendMessage(
        from,
        `*Ha ocurrido un error al ejecutar el comando \`${body}\`*\n*Mira la consola para más detalle*`
      )
    }
  }
}
