const { configEnv } = require('../../helpers/Helpers.cjs')
const { execPromise } = require('../../helpers/exec.promise.cjs')
const argv2Object = require('../../helpers/argv2object.cjs')
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
      } catch (_e) {
        /* return await client.sendMessage(
          from,
          smsErrorUrl
        ) */
        console.log('(X) No es una url de imagen, se comprobara si es un argumento acontinuacion'.red)
      }
    }
    if (msg.hasMedia && body.startsWith('/st')) {
      const nameFile = './stik/file' + Date.now() + '.png'
      const nameFileOutput = './stik/output' + Date.now() + '.png'
      const media = await msg.downloadMedia()
      try {
        const argv = argv2Object(true, [url])
        // eslint-disable-next-line no-prototype-builtins
        if (argv.hasOwnProperty('remove') && argv.remove === 'bg') {
          // código a ejecutar si la propiedad 'remove' existe y su valor es 'bg'
          fs.writeFileSync(nameFile, media.data, { encoding: 'base64' })
          const ifUbuntu = configEnv.NODE_ENV === 'production' ? '3' : ''
          await execPromise(`python${ifUbuntu} -m backgroundremover.cmd.cli -i "${nameFile}" -o "${nameFileOutput}"`)
          const mediaFileOutput = MessageMedia.fromFilePath(nameFileOutput)
          client.sendMessage(from, mediaFileOutput, { stickerAuthor: '<Bot>', stickerName: '/st', sendMediaAsSticker: true })
          fs.unlinkSync(nameFile)
          fs.unlinkSync(nameFileOutput)
        } else {
          // código a ejecutar si la propiedad 'remove' no existe o su valor no es 'bg'
          return await client.sendMessage(from, 'No es un argumento valido, usa *_/st -remove=bg_* para remover el fondo de la imagen')
        }
      } catch (_e) {
        console.log('(X) No es un argumento valido'.red)
        client.sendMessage(from, media, { stickerAuthor: '<Bot>', stickerName: '/st', sendMediaAsSticker: true })
      }
    }
  }
}
