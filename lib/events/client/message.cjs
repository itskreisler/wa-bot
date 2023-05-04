const { owners, ownersId } = require('../../helpers/Helpers.cjs')
module.exports = async (client, msg) => {
  const { body, from } = msg
  const [existe, [ExpReg, comando]] = client.findCommand(body)
  if (existe) {
    if (comando.OWNER) {
      if (!ownersId.includes(from)) {
        return await client.sendMessage(
          from,
          `❌ *Solo los dueños de este bot pueden ejecutar este comando*\n*Dueños del bot:* ${owners
            .map(([user, id]) => `[${user}](tg://user?id=${id})`)
            .join(', ')}`
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
