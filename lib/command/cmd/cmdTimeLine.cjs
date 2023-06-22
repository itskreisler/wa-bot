const { configEnv: { BOT_USERNAME }, ownersId, MarkdownWsp: { monoespaciado } } = require('../../helpers/Helpers.cjs')
const dayjs = require('dayjs')

const { execPromise } = require('../../helpers/exec.promise.cjs')
const { MessageMedia } = require('whatsapp-web.js')
const timelineUrl = 'https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/timeline.js'
const listOfNumberEmojis = {
  0: '0️⃣',
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
  9: '9️⃣'
}
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/timeline(?:_(\\w+))?(?:@${BOT_USERNAME})?$`, 'im'),
  /**
   * Logica del comando
   *
   * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   */
  async cmd (client, msg, match) {
    const { from, author } = msg
    const [, command] = match
    //
    const fileTimeLine = 'timeline.mjs'
    const imgTimeLine = 'timeline.png'
    const timeDifferenceEvent = 0
    const timeDifferenceAsia = 0
    let lastEventTime = dayjs().year(2000)
    function convertToDate (e, i) {
      let start
      if (e.timezoneDependent) {
        start = dayjs(e.start, 'YYYY-MM-DD HH:mm:ss').subtract(
          timeDifferenceAsia,
          'minute'
        )
      } else {
        start = dayjs(e.start, 'YYYY-MM-DD HH:mm:ss').subtract(
          timeDifferenceEvent,
          'minute'
        )
      }
      const end = dayjs(e.end, 'YYYY-MM-DD HH:mm:ss').subtract(
        timeDifferenceEvent,
        'minute'
      )
      const duration = end.diff(start, 'day', true)

      if (lastEventTime < end) lastEventTime = end

      return {
        ...e,
        index: i,
        start,
        end,
        duration
      }
    }
    function processEvent (eventsData) {
      const fechaActual = new Date()
      let events = []
      events = eventsData.map((e, i) => {
        if (Array.isArray(e)) {
          const temp = e.filter((evento) => {
            const fechaInicio = new Date(evento.start)
            const fechaFin = new Date(evento.end)
            return fechaActual >= fechaInicio && fechaActual <= fechaFin
          })
          return temp.map(({ name, image, start, end, url, description }) =>
            convertToDate(
              {
                name,
                image,
                start,
                end,
                url,
                description,
                ending: obtenerTiempoRestante(end)
              },
              i
            )
          )
        }

        return convertToDate(e, i)
      })

      events.slice().sort((a, b) => {
        if (Array.isArray(a) && Array.isArray(b)) {
          return a[0].start - b[0].start
        } else if (!Array.isArray(a) && Array.isArray(b)) {
          return a.start - b[0].start
        } else if (Array.isArray(a) && !Array.isArray(b)) {
          return a[0].start - b.start
        } else {
          return a.start - b.start
        }
      })
      return events
    }
    function obtenerTiempoRestante (fecha) {
      const fechaActual = new Date()
      const fechaObjetivo = new Date(fecha)

      const tiempoRestante = fechaObjetivo.getTime() - fechaActual.getTime()

      const segundos = Math.floor(tiempoRestante / 1000) % 60
      const minutos = Math.floor(tiempoRestante / (1000 * 60)) % 60
      const horas = Math.floor(tiempoRestante / (1000 * 60 * 60)) % 24
      const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24))

      const tiempoRestanteFormateado = `Acabando en ${dias}d ${horas
        .toString()
        .padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos
        .toString()
        .padStart(2, '0')}`

      return tiempoRestanteFormateado
    }
    async function generateImage () {
      const { chromium } = require('playwright')
      const btnTimeline = '[href="/timeline"]'
      const slcServer = '[class^="select-none relative w-64 svelte"] [class^="flex w-full relative items-center px-4 bg-background rounded-2xl h-14 focus:outline-none focus:border-primary border-2 border-transparent ease-in duration-100 cursor-pointer border-transparent svelte"]'
      const opAmerica = '[class^="bg-item rounded-2xl absolute mt-2 p-2 w-full z-50 flex flex-col text-white shadow-xl border border-background"] > span:nth-child(2)'
      const isPageTimeLine = '[class^="absolute rounded-xl top-0 text-center bg-white text-black svelte"]'
      const browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto('https://paimon.moe/settings', { waitUntil: 'domcontentloaded' })
      await page.waitForSelector(slcServer)
      await page.click(slcServer)
      await page.waitForSelector(opAmerica)
      await page.click(opAmerica)
      await page.waitForSelector(btnTimeline)
      await page.click(btnTimeline)
      await page.waitForSelector(isPageTimeLine)
      await page.screenshot({ path: `./tmp/${imgTimeLine}` })
      await browser.close()
    }
    //
    switch (command) {
      case 'update':
        (async () => {
          const chat = await msg.getChat()
          const usuarioId = Number(chat.isGroup ? author.split('@').shift() : from.split('@').shift())
          if (!ownersId.includes(usuarioId)) {
            await client.sendMessage(
              from,
              '❌ *Solo los dueños de este bot pueden ejecutar este comando*\n'
            )
            return
          }
          execPromise(`curl -o ./tmp/${fileTimeLine} "${timelineUrl}"`).then(async () => {
            await generateImage()
            const { eventsData } = await import(`../../../tmp/${fileTimeLine}`)
            const eventosActuales = processEvent(eventsData)
            const caption = eventosActuales.map(listOfEvents => listOfEvents.map(({ name, ending, index }) => `${listOfNumberEmojis[index]} ${monoespaciado(`| ${name} ⏲️ ${ending}`)}\n`)).join('\n')
            const media = MessageMedia.fromFilePath(`./tmp/${imgTimeLine}`)
            client.sendMessage(from, media, { caption })
          }).catch((error) => {
            console.log(error)
            client.sendMessage(from, 'Error al actualizar la información de los eventos')
          })
        })()
        break
      case 'image':
        (async () => {
          await generateImage()
          const media = MessageMedia.fromFilePath(`./tmp/${imgTimeLine}`)
          client.sendMessage(from, media, { caption: 'Imagen actualizada\nhttps://paimon.moe/timeline' })
        })()
        break
      default:
        (async () => {
          try {
            const { eventsData } = await import(`../../../tmp/${fileTimeLine}`)
            const eventosActuales = processEvent(eventsData)
            const mensaje = eventosActuales.map(listOfEvents => listOfEvents.map(({ name, ending, index }) => `${listOfNumberEmojis[index]} ${monoespaciado(`| ${name} ⏲️ ${ending}`)}\n`)).join('\n')
            client.sendMessage(from, mensaje)
          } catch (error) {
            console.log(error)
            client.sendMessage(from, 'Error al obtener la información de los eventos')
          }
        })()
        break
    }
  }
}
