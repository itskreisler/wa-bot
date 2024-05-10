const { configEnv: { BOT_USERNAME }, MarkdownWsp } = require('../../helpers/Helpers.cjs')
const { latestEpisodesAdded } = require('animeflv')
//const { execPromise } = require('../../helpers/exec.promise.cjs')
//const fs = require('fs')
const { MessageMedia } = require('whatsapp-web.js')
//const ifUbuntu = NODE_ENV === 'production' ? '3' : ''
const mock = [{
  "id": "tensei-shitara-slime-datta-ken-3rd-season-2",
  "title": "Tensei shitara Slime Datta Ken 3rd Season",
  "poster": "https://animeflv.net/uploads/animes/thumbs/3966.jpg",
  "episode": 2,
  "servers": [
    {
      "server": "mega",
      "title": "MEGA",
      "ads": 0,
      "url": "https://mega.nz/#!ZWcTDbiD!a-QJgFwgmmqVD4eBCh0HbDvWCkLGpHqMuDel17gghfA",
      "allow_mobile": true,
      "code": "https://mega.nz/embed#!ZWcTDbiD!a-QJgFwgmmqVD4eBCh0HbDvWCkLGpHqMuDel17gghfA"
    },
    {
      "server": "sw",
      "title": "SW",
      "ads": 0,
      "allow_mobile": true,
      "code": "https://streamwish.to/e/8081j0fr10kx"
    },
    {
      "server": "yu",
      "title": "YourUpload",
      "ads": 0,
      "allow_mobile": true,
      "code": "https://www.yourupload.com/embed/0g8680aaX2As"
    },
    {
      "server": "maru",
      "title": "Maru",
      "ads": 0,
      "allow_mobile": true,
      "code": "https://my.mail.ru/video/embed/7512958666216053237#aylaz9ymde#6645"
    },
    {
      "server": "okru",
      "title": "Okru",
      "ads": 0,
      "allow_mobile": true,
      "code": "https://ok.ru/videoembed/7680484575921"
    },
    {
      "server": "netu",
      "title": "Netu",
      "ads": 1,
      "allow_mobile": true,
      "code": "https://hqq.tv/player/embed_player.php?vid=WDZ5WGxPUElvbU1DRW9aSFo5M0xHUT09"
    },
    {
      "server": "stape",
      "title": "Stape",
      "ads": 1,
      "url": "https://streamtape.com/v/J0W27V6Mrecj1RP/",
      "allow_mobile": true,
      "code": "https://streamtape.com/e/J0W27V6Mrecj1RP/"
    }
  ]
}]
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/flv(?:_(\\w+))?(?:@${BOT_USERNAME})?$`, 'im'),
  /**
   * Logica del comando
   *
   * @param {import('../../core/Client.cjs')} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   * @param {RegExpMatchArray} match - Resultado de la expresion regular
   */
  async cmd(client, msg, match) {
    const CRON_JOB = `0 */15 6-23 * * * *`
    const [_x, accion] = match
    //const { from } = msg
    // obtener el chat
    const chat = await msg.getChat()
    const { id: { _serialized }, isGroup } = chat
    if (!isGroup) {
      return await msg.reply('Este comando solo puede ser usado en grupos')
    }
    switch (accion) {
      case 'list':
        const keys = Object.keys(client.db)
        const total = keys.length
        const list = keys.sort((a, b) => a.localeCompare(b)).map((key) => {
          const { title, episode } = client.db[key]
          return `${MarkdownWsp.negrita(title)} #${episode}`
        }).join('\n')
        await msg.reply(`Episodios en la base de datos: ${total}\n${list}`)
        break
      case 'clear':
        client.db = {}
        await msg.reply('Base de datos limpiada')
        break
      case 'start':
        (async () => {
          const temp = (await latestEpisodesAdded()).reduce((acc, { id, ...capitulo }) => {
            acc[id] = { ...capitulo, id }
            return acc
          }, {})
          client.db = temp
          await msg.reply('Se han añadido los episodios actuales a la base de datos')
        })()
        break
      case 'on':
        // validar si en client.db hay un registro del nuevo episodio
        const [animeFLVtask] = client.createTask(_serialized, CRON_JOB, async () => {
          //client.interface.openChatWindowAt(_serialized);
          const episodes = await latestEpisodesAdded()
          // const episodes = mock
          let contadorNewEpisodes = 0
          episodes.forEach(async (capitulo) => {
            const { id, episode, title, poster, servers } = capitulo
            console.log(`validando si ${id} existe en client.db...`)
            if (!(id in client.db)) {
              contadorNewEpisodes++
              client.ALERT_NEW_EPISODES = true
              client.db[id] = capitulo
              // valida si estae le servidor OKRU
              if (servers) {
                console.log(`Creando miniatura de ${title} #${episode}...`)
                const thumbnail = await MessageMedia.fromUrl(poster)
                const enlaces_para_ver = servers.map(({ title, code }) => `${MarkdownWsp.blockQuote(`${MarkdownWsp.negrita(title)}: ${code}`)}`).join('\n')
                const caption = `${MarkdownWsp.blockQuote(`El episodio #${episode} de ${MarkdownWsp.negrita(title)} ya está disponible\n`)}`.concat(enlaces_para_ver)
                console.log(`Enviando poster de ${title} #${episode}...`)
                try {
                  await client.sendMessage(_serialized, thumbnail, { caption })
                  /* const script = `python${ifUbuntu} okrudl.py -u ${code} -f "${id}"`
                  console.log(`Descargando y reduciendo tamaño de ${title} #${episode}...`)
                  await execPromise(script)
                  console.log(`Archivo descargado y reducido, ${title} #${episode}...`)
                  const rutaArchivo_min = `./OK-RU/${id}_min.mp4`
                  const rutaArchivo = `./OK-RU/${id}.mp4`
                  console.log(`Enviando ${title} #${episode} a ${_serialized}...`)
                  const mediaFileOutput = MessageMedia.fromFilePath(rutaArchivo_min)
                  // await client.sendMessage(_serialized, mediaFileOutput,{sendMediaAsDocument: true})
                  client.sendMessage(_serialized, mediaFileOutput, { caption }).then(() => {
                    fs.unlinkSync(rutaArchivo_min)
                    fs.unlinkSync(rutaArchivo)
                    console.log(`Archivo ${rutaArchivo_min} eliminado.`)
                    console.log(`Archivo ${rutaArchivo} eliminado.`)
                  })
                  console.log(`${title} #${episode} descargado, minimizado y enviado.`) */
                } catch (e) {
                  console.log('Ha ocurrido un error al enviar el episodio', e)
                  await client.sendMessage(_serialized, `Ha ocurrido un error al enviar el episodio ${episode} de ${title}`)
                }
              } else {
                //await client.sendMessage(_serialized, )
              }
            }
          })
          if (contadorNewEpisodes === 0) {
            // obtener los mensajes del chat
            const msg_chat = await chat.fetchMessages({ limit: 100, fromMe: true })
            // filtrar mensajes del bot
            const botMessages = msg_chat.filter(({ fromMe, hasMedia, body }) => fromMe && hasMedia && body?.startsWith(MarkdownWsp.blockQuote('El episodio #')))

            console.log("No hay nuevos episodios");
            console.log("Mensaje del bot", botMessages?.length)
            if (botMessages && botMessages?.length > 0) {
              /**
               * @type {import('whatsapp-web.js').Message}
               */
              const lastMsg = botMessages.unshift()
              const { timestamp, body } = lastMsg
              console.log("El ultimo episodio enviado fue", body.slice(0, 30));
              const fecha = new Date(timestamp * 1000);
              const dateNow = new Date();
              // Obtener la hora de la fecha

              const diferencia = ((fecha1, fecha2) => {
                const diferenciaEnMilisegundos = Math.abs(fecha2 - fecha1);
                const horas = diferenciaEnMilisegundos / (1000 * 60 * 60);
                return Math.floor(horas);

              })(fecha, dateNow)
              // Si la diferencia es mayor a 5 horas desde la ultima notificacion
              if (diferencia > 10 && client.ALERT_NEW_EPISODES) {
                client.ALERT_NEW_EPISODES = false
                const Tohka_Yatogami = MessageMedia.fromFilePath('./lib/public/Tohka_Yatogami.webp')
                await client.sendMessage(_serialized, Tohka_Yatogami, { sendMediaAsSticker: true, stickerAuthor: 'Tohka Yatogami', stickerName: 'Tohka Yatogami', stickerCategories: ['Tohka Yatogami'] })
              } else {
                console.log(`No es la hora - ${fecha.toLocaleString()}`, { diferencia });
              }
            }
            //await client.sendMessage(_serialized, 'No hay nuevos episodios, se volvera a revisar en 1 hora')
          }
        })
        if (!animeFLVtask) {
          await msg.reply('Ya estás recibiendo notificaciones de nuevos episodios en este grupo')
        } else {
          await msg.reply('Notificaciones activadas')
        }
        break
      case 'off':
        (async () => {
          const [fueDestruida] = client.destroyTask(_serialized)
          if (fueDestruida) {
            await msg.reply('Notificaciones desactivadas')
          } else {
            await msg.reply('No hay notificaciones activas')
          }
        })()
        break
      default:
        (async () => await msg.reply('Debes especificar si deseas activar o desactivar las notificaciones de nuevos episodios'))()
        break
    }
  }
}
