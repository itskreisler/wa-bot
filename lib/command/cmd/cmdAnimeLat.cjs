const { configEnv: { BOT_USERNAME }, MarkdownWsp } = require('../../helpers/Helpers.cjs')
const { getLatest } = require('latanime-api')

const { MessageMedia } = require('whatsapp-web.js')
// const ifUbuntu = NODE_ENV === 'production' ? '3' : ''

module.exports = {
  active: true,
  ExpReg: new RegExp(`^/lat(?:_(\\w+))?(?:@${BOT_USERNAME})?$`, 'im'),
  /**
   * @description Comando para obtener los ultimos episodios de latanime.org
   *
   * @param {import('../../core/Client.cjs')} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   * @param {RegExpMatchArray} match - Resultado de la expresion regular
   */
  async cmd(client, msg, match) {
    const CRON_JOB = '0 */15 6-23 * * * *'
    const [, accion] = match
    // const { from } = msg
    // obtener el chat
    const chat = await msg.getChat()
    const { id: { _serialized }, isGroup } = chat
    if (!isGroup) {
      return await msg.reply('Este comando solo puede ser usado en grupos')
    }
    switch (accion) {
      case 'list': {
        const keys = Object.keys(client.db.latanime)
        const total = keys.length
        const list = keys.sort((a, b) => a.localeCompare(b)).map((key) => {
          const { title, episode } = client.db.latanime[key]
          return `${MarkdownWsp.negrita(title)} #${episode}`
        }).join('\n')
        await msg.reply(`Episodios en la base de datos: ${total}\n${list}`)
        break
      }
      case 'clear': {
        client.db.latanime = {}
        await msg.reply('Base de datos limpiada')
        break
      }
      case 'start': {
        const temp = (await getLatest()).reduce((acc, { url, chapter, ...capitulo }) => {
          acc[url] = { ...capitulo, url, chapter, id: url, episode: chapter }
          return acc
        }, {})
        client.db.latanime = temp
        //
        await msg.reply('Se han añadido los episodios actuales a la base de datos')
        break
      }
      case 'off': {
        const [fueDestruida] = client.destroyTask('lat'.concat(_serialized))
        if (fueDestruida) {
          await msg.reply('Notificaciones desactivadas')
        } else {
          await msg.reply('No hay notificaciones activas')
        }
        break
      }
      case 'on': {
        // validar si en client.db.latanime hay un registro del nuevo episodio
        const [animeLatTask] = client.createTask('lat'.concat(_serialized), CRON_JOB, async () => {
          const episodes = (await getLatest()).slice(0, 2)
          let contadorNewEpisodes = 0
          episodes.forEach(async (capitulo) => {
            const { chapter, cover, title, url } = capitulo
            console.log(`validando si ${title} existe en client.db.latanime..`)
            if (!(url in client.db.latanime)) {
              contadorNewEpisodes++
              client.ALERT_NEW_EPISODES_LAT = true
              client.db.latanime[url] = { ...capitulo, url, chapter, id: url, episode: chapter }
              console.log(`Creando miniatura de ${title} #${chapter}...`)
              const thumbnail = await MessageMedia.fromUrl(cover)
              const caption = `${MarkdownWsp.blockQuote('latanime.org\n')}`
                .concat(`${MarkdownWsp.blockQuote(`El episodio #${chapter} de ${MarkdownWsp.negrita(title)} ya está disponible\n`)}`)
                .concat(MarkdownWsp.blockQuote(url))
              console.log(`Enviando poster de ${title} #${chapter}...`)
              try {
                await client.sendMessage(_serialized, thumbnail, { caption })
              } catch (e) {
                console.log('Ha ocurrido un error al enviar el episodio', e)
                await client.sendMessage(_serialized, `Ha ocurrido un error al enviar el episodio ${chapter} de ${title}`)
              }
            }
          })
          if (contadorNewEpisodes === 0) {
            // obtener los mensajes del chat
            const msgChat = await chat.fetchMessages({ limit: 100, fromMe: true })
            // filtrar mensajes del bot
            const botMessages = msgChat.filter(({ fromMe, hasMedia, body }) => fromMe && hasMedia && body?.startsWith(MarkdownWsp.blockQuote('latanime.org')))

            console.log('No hay nuevos episodios en latanime.org')
            console.log('Mensaje del bot', botMessages?.length, 'latanime.org')
            if (botMessages && botMessages?.length > 0) {
              /**
                 * @type {import('whatsapp-web.js').Message[]}
                 */
              const [lastMsg] = botMessages.slice(-1)
              const { timestamp, body } = lastMsg
              console.log('El ultimo episodio enviado fue', body.slice(0, 50), 'latanime.org')
              const fecha = new Date(timestamp * 1000)
              const dateNow = new Date()
              // Obtener la hora de la fecha
              const diferencia = ((fecha1, fecha2) => {
                const diferenciaEnMilisegundos = Math.abs(fecha2 - fecha1)
                const horas = diferenciaEnMilisegundos / (1000 * 60 * 60)
                return Math.floor(horas)
              })(fecha, dateNow)
              if (diferencia > 10 && client.ALERT_NEW_EPISODES_LAT) {
                client.ALERT_NEW_EPISODES_LAT = false
                const tohkaYatogami = MessageMedia.fromFilePath('./lib/public/Tohka_Yatogami.webp')
                await client.sendMessage(_serialized, tohkaYatogami, { sendMediaAsSticker: true, stickerAuthor: 'Tohka Yatogami', stickerName: 'Tohka Yatogami', stickerCategories: ['Tohka Yatogami'] })
              } else {
                console.log(`No es la hora - ${fecha.toLocaleString()}`, { diferencia }, 'latanime.org')
              }
            }
          }
        })
        if (!animeLatTask) {
          await msg.reply('Ya estás recibiendo notificaciones de nuevos episodios en este grupo')
        } else {
          await msg.reply('Notificaciones activadas')
        }
        break
      }
      default: {
        await msg.reply('Debes especificar si deseas activar o desactivar las notificaciones de nuevos episodios')
        break
      }
    }
  }
}
