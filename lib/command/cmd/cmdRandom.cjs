const { configEnv: { BOT_USERNAME }, trimText, shuffleArray, MarkdownWsp: { monoespaciado, negrita } } = require('../../helpers/Helpers.cjs')
/**
 * Comando para obtener un texto aleatorio
 */
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/r(?:andom)?(?:_(\\w+))?(?:@${BOT_USERNAME})?(?:\\s+(.+))?$`, 'mis'),
  /**
   * Logica del comando
   *
   * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   */
  async cmd (client, msg, match) {
    // const { from } = msg
    const [, ifShuffle, text] = match
    const existShuffle = typeof ifShuffle !== 'undefined'
    async function sendRandomText (body) {
      if (body) {
        const text = trimText(body)
        const listOfArray = text.split('\n')
        // barajar el texto
        let randomArray
        switch (ifShuffle?.toLowerCase()) {
          case 's':
          case 'shuffle':
            randomArray = shuffleArray(listOfArray)
            break
          default:
            randomArray = listOfArray
            break
        }
        // elegir un índice aleatorio
        const randomIndex = Math.floor(Math.random() * randomArray.length)
        // elegir un texto aleatorio
        const randomText = randomArray[randomIndex]
        // crear mensaje con el texto aleatorio
        const mensajeConShuffle = existShuffle ? `Lista desordenada:\n${randomArray.join('\n')}\n` : ''
        // responder con el texto aleatorio
        await msg.reply(mensajeConShuffle.concat(`Elemento aleatorio (# ${negrita(randomIndex + 1)}):\n`, monoespaciado(randomText)))
      }
    }
    if (msg.hasQuotedMsg) {
      const { body } = await msg.getQuotedMessage()
      // validar si el mensaje es un texto
      sendRandomText(body)
      return
    }

    sendRandomText(text)
  }
}
