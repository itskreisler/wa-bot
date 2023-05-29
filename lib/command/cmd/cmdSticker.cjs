/**
 * @description Comando para enviar stickers, tambien se puede usar para remover el fondo de una imagen con la libreria https://github.com/nadermx/backgroundremover
 */

const { configEnv } = require('../../helpers/Helpers.cjs')
const { execPromise } = require('../../helpers/exec.promise.cjs')
const argv2Object = require('../../helpers/argv2object.cjs')
const { MessageMedia } = require('whatsapp-web.js')
const fs = require('fs')
const request = require('request')
const { exec } = require('child_process')
const fileType = require('file-type')
const optionsMessage = { stickerAuthor: '<Bot>', stickerName: '/st', sendMediaAsSticker: true }
const smsErrorUrl = 'Debes introducir una url de imagen valida o adjuntar una foto o video con el comentario _/st_ para responderte a algo\n✅ *Fotmatos soportados*\n-png,jpg,jpeg\n❌ *Formatos no soportados*\n-webp\nAqui tienes un ejemplo de uso.\n_/st https://placekitten.com/350/350_\n_/st -remove=bg_'
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/st(?:@${configEnv.BOT_USERNAME})?(\\s+)((.|\n)+)$|^/st(?:@${configEnv.BOT_USERNAME})?$`, 'im'),
  async cmd (client, msg, match) {
    const { body, from } = msg
    const [, , url] = match
    const sendStickerFromCmd = async (msg) => {
      const nameFile = './stik/file' + Date.now() + '.png'
      const nameFileOutput = './stik/output' + Date.now() + '.png'
      const media = await msg.downloadMedia()
      try {
        const argv = argv2Object(true, [url])
        const modelodefault = 'bg'
        const u2net = 'u2net'
        const u2netHumanSeg = 'u2net_human_seg'
        // busca si existe la propiedad 'remove' en el objeto argv
        // eslint-disable-next-line no-prototype-builtins
        if (argv.hasOwnProperty('remove') && argv.remove?.length > 0) {
          // código a ejecutar si la propiedad 'remove' existe y su valor es 'bg'
          fs.writeFileSync(nameFile, media.data, { encoding: 'base64' })
          // si es ubuntu se usa python3
          const ifUbuntu = configEnv.NODE_ENV === 'production' ? '3' : ''
          const m = argv.remove === modelodefault ? u2net : u2netHumanSeg
          // ejecuta el comando de python
          await execPromise(`python${ifUbuntu} -m backgroundremover.cmd.cli -i "${nameFile}" -m "${m}" -o "${nameFileOutput}"`)
          const mediaFileOutput = MessageMedia.fromFilePath(nameFileOutput)
          client.sendMessage(from, mediaFileOutput, optionsMessage)
          fs.unlinkSync(nameFile)
          fs.unlinkSync(nameFileOutput)
        } else {
          // código a ejecutar si la propiedad 'remove' no existe o su valor no es 'bg'
          await client.sendMessage(from, 'No es un argumento valido, usa *_/st -remove=bg_* para remover el fondo de la imagen')
          return
        }
      } catch (_e) {
        console.log('(X) No es un argumento valido'.red)
        // si no hay argumentos se envia el sticker normal
        client.sendMessage(from, media, optionsMessage)
      }
    }

    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage()
      if (quotedMsg.hasMedia) {
        sendStickerFromCmd(quotedMsg)
        return
      }
    }
    if (typeof url === 'undefined' && !msg.hasMedia) {
      console.log("🚀 ~ file: cmdSticker.cjs:50 ~ cmd ~ typeof url === 'undefined' && !msg.hasMedia:", typeof url === 'undefined' && !msg.hasMedia)

      await client.sendMessage(
        from,
        smsErrorUrl
      )
      return
    }
    if (typeof url !== 'undefined' && !msg.hasMedia) {
      console.log("🚀 ~ file: cmdSticker.cjs:57 ~ cmd ~ typeof url !== 'undefined' && !msg.hasMedia:", typeof url !== 'undefined' && !msg.hasMedia)
      try {
        // eslint-disable-next-line no-unused-vars
        const _isUrl = new URL(url)
        const urlRequest = await fetch(url)
        const urlArrayBuffer = await urlRequest.arrayBuffer()
        const imageType = await fileType.fromBuffer(urlArrayBuffer)
        if (!imageType.mime.startsWith('image/') || imageType.ext === 'webp') {
          await client.sendMessage(
            from,
            smsErrorUrl
          )
          return
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
              client.sendMessage(to, media, optionsMessage)
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
      sendStickerFromCmd(msg)
    }
  }
}
