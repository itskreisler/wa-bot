const { configEnv, randomAnswer } = require('../../helpers/Helpers.cjs')

module.exports = {
  active: true,
  ExpReg: new RegExp(
        `^/whatif(?:@${configEnv.USERNAME_BOT})?(\\s+)((.|\n)+)$|^/whatif(?:@${configEnv.USERNAME_BOT})?$`,
        'im'
  ),
  async cmd (bot, msg, match) {
    const {
      _data: { notifyName },
      from
    } = msg

    const [, , question] = match
    if (typeof question === 'undefined') {
      return await bot.sendMessage(
        from,
        'Debes introducir un texto para responderte a algo\nAqui tienes un ejemplo de uso.\n/whatif ¿¡Preguntame lo que quieras!?'
      )
    }
    const userQ = `@${notifyName ?? from.username} preguntó: *${question}*\n`
    const botA = `*Mi respuesta es:* ${randomAnswer()}`
    bot.sendMessage(from, userQ + botA)
  }
}
