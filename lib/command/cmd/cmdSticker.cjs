const { configEnv } = require('../../helpers/Helpers.cjs')
const { MessageMedia } = require('whatsapp-web.js')
const fs = require('fs')
const request = require('request')
const { exec } = require('child_process')
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/st(?:@${configEnv.USERNAME_BOT})?(\\s+)((.|\n)+)$|^/st(?:@${configEnv.USERNAME_BOT})?$`, 'im'),
  async cmd (client, msg, match) {
    const { body, from } = msg
    const [, , url] = match
    if (typeof url === 'undefined' && !msg.hasMedia) {
      return await client.sendMessage(
        from,
        'Debes introducir una url valida o adjuntar una foto o video con el comentario */st* para responderte a algo\nAqui tienes un ejemplo de uso.\n/st https://example.com/img.png'
      )
    }
    if (typeof url !== 'undefined' && !msg.hasMedia) {
      console.log({ url })
      const sendStickerFromUrl = async (to, url) => {
        const names = Date.now() / 10000
        const download = function (uri, filename, callback) {
          request.head(uri, function (_err, _res, _body) {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
          })
        }
        download(url, './stik' + names + '.png', async function () {
          console.log('selesai', { url })
          const filess = './stik' + names + '.png'
          const asw = './stik' + names + '.webp'
          exec(`ffmpeg -i ${filess} -vcodec libwebp -filter:v fps=fps=20 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ${asw}`, (_err) => {
            // const media = fs.readFileSync(asw)
            const media = MessageMedia.fromFilePath(asw)
            // console.log({ media })
            console.log('try send sticker')
            client.sendMessage(to, media, { sendMediaAsSticker: true })
            fs.unlinkSync(filess)
            fs.unlinkSync(asw)
          })
        })
      }
      sendStickerFromUrl(from, url)
    }
    if (msg.hasMedia && body.startsWith('/st')) {
      const media = await msg.downloadMedia()
      // Haz algo con los datos de los medios aquí
      client.sendMessage(from, media, { stickerAuthor: '<Bot>', stickerName: '/st', sendMediaAsSticker: true })
    }
  }
}
