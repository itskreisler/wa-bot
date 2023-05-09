const { configEnv } = require('../../helpers/Helpers.cjs')
const { MessageMedia } = require('whatsapp-web.js')
const fs = require('fs')
const request = require('request')
const { exec } = require('child_process')
const fileType = require('file-type')
const smsErrorUrl = 'Debes introducir una url de imagen valida o adjuntar una foto o video con el comentario _/st_ para responderte a algo\n✅ *Fotmatos soportados*\n-png,jpg,jpeg\n❌ *Formatos no soportados*\n-webp\nAqui tienes un ejemplo de uso.\n_/st https://placekitten.com/350/350_'
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/st(?:@${configEnv.USERNAME_BOT})?(\\s+)((.|\n)+)$|^/st(?:@${configEnv.USERNAME_BOT})?$`, 'im'),
  async cmd (client, msg, match) {
    const { body, from } = msg
    const [, , url] = match
    if (typeof url === 'undefined' && !msg.hasMedia) {
      return await client.sendMessage(
        from,
        smsErrorUrl
      )
    }
    if (typeof url !== 'undefined' && !msg.hasMedia) {
      try {
        // eslint-disable-next-line no-unused-vars
        const _isUrl = new URL(url)
        const urlRequest = await fetch(url)
        const urlArrayBuffer = await urlRequest.arrayBuffer()
        const imageType = await fileType.fromBuffer(urlArrayBuffer)
        if (!imageType.mime.startsWith('image/') || imageType.ext === 'webp') {
          return await client.sendMessage(
            from,
            smsErrorUrl
          )
        }
      } catch (_e) {
        return await client.sendMessage(
          from,
          smsErrorUrl
        )
      }
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
