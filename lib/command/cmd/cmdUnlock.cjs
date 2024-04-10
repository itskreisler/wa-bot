const { configEnv: { BOT_USERNAME } } = require('../../helpers/Helpers.cjs')
// const { MessageMedia } = require('whatsapp-web.js')
/**
 * Descarga la multimedia de un mensaje recursivamente
 * @param {import('whatsapp-web.js').Message} message - Mensaje de whatsapp-web.js
 * @returns {Promise<import('whatsapp-web.js').MessageMedia>} - Multimedia del mensaje
 *
 */
async function downloadMediaRecursively(message) {
  let media = null

  if (message.hasMedia) {
    media = await message.downloadMedia()
  } else if (message.hasQuotedMsg) {
    const quotedMsg = await message.getQuotedMessage()
    if (quotedMsg) {
      media = await downloadMediaRecursively(quotedMsg)
    }
  }

  return media
}
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/unlock(?:@${BOT_USERNAME})?$`, 'im'),
  /**
   * Logica del comando
   *
   * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} message - Mensaje de whatsapp-web.js
   */
  async cmd(client, message) {
    const { from } = message
    if (!message.hasQuotedMsg) {
      await client.sendMessage(from, 'P-perdona, necesitas ejecutar el comando junto a la multimedia que deseas desbloquear.')
      return
    }
    const media = await downloadMediaRecursively(message)
    // valida si existe la multimedia
    if (!media) {
      message.reply('No se pudo desbloquear.')
      return
    }
    const chat = await message.getChat()
    //enviar como imagen y obtener el id del mensaje
    await chat.sendMessage(media)


    //enviar como documento y responder con el id del mensaje
    /*const nameFileOutput = 'unlock'.concat(Date.now(), '.jpg')
    require('fs').writeFileSync(nameFileOutput, media.data, { encoding: 'base64' })
    const mediaFileOutput = MessageMedia.fromFilePath(nameFileOutput)
    await client.sendMessage(from, mediaFileOutput, { sendMediaAsDocument: true })*/
  }
}
