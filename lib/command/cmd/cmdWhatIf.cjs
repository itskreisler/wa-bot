const { configEnv, randomAnswer } = require('../../helpers/Helpers.cjs')

module.exports = {
  active: true,
  ExpReg: new RegExp(
        `^/whatif(?:@${configEnv.BOT_USERNAME})?(\\s+)((.|\n)+)$|^/whatif(?:@${configEnv.BOT_USERNAME})?$`,
        'im'
  ),
  /**
   * Logica del comando
   * @param {import('whatsapp-web.js').Client} bot - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   * @param {RegExpMatchArray} match - Resultado de la expresion regular
   *
   *
   */
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
    const randomAnswerText = (() => {
      const probabilidad = Math.random()
      if (probabilidad < 0.5) {
        return randomAnswer()
      } else {
        return randomAnswer()
      }
    })()
    const botA = `*Mi respuesta es:* ${randomAnswerText}`
    bot.sendMessage(from, userQ + botA)
  }
}
