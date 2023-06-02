const { Client, LocalAuth } = require('whatsapp-web.js')
const { configEnv: { BOT_PREFIX } } = require('../helpers/Helpers.cjs')
const BotUtils = require('./Utils.cjs')
const Database = require('../db/database.sqlite3.cjs')
module.exports = class extends Client {
  commands = new Map()
  upTime
  constructor (
    options = {
      authStrategy: new LocalAuth()
    }
  ) {
    super({
      ...options
    })
    this.db = new Database()
    this.commands = new Map()
    this.upTime = Date.now()
    this.utils = new BotUtils(this)
    this.start()
  }

  // importar typos de whatsapp-web.js
  /**
   * @typedef {import('whatsapp-web.js').Message} Message
   * @typedef {import('whatsapp-web.js').MessageContent} MessageContent
   * @typedef {import('whatsapp-web.js').MessageSendOptions} MessageSendOptions
   * @param {string} chatId
   * @param {MessageContent} images
   * @param {MessageSendOptions} options
   * @returns {Promise<Message>}
   */
  async sendMediaGroupTenByTen (chatId, images, options = {}) {
    // Divide las imágenes en grupos de 10
    const chunkedImages = images.reduce((acc, cur, i) => {
      if (i % 10 === 0) {
        acc.push([cur])
      } else {
        acc[acc.length - 1].push(cur)
      }
      return acc
    }, [])

    // Envía cada grupo de 10 imágenes
    for (const chunk of chunkedImages) {
      await this.sendMessage(chatId, chunk, options)
    }
  }

  async start () {
    await this.loadEvents()
    await this.loadHandlers()
    await this.loadCommands()
  }

  async loadCommands () {
    console.log(`(${BOT_PREFIX}) Cargando comandos`.yellow)
    this.commands.clear()
    const RUTA_ARCHIVOS = await this.utils.loadFiles('/lib/command')

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          const COMANDO = require(rutaArchivo)
          const NOMBRE_COMANDO = rutaArchivo
            .split('\\')
            .pop()
            .split('/')
            .pop()
            .split('.')
            .shift()
          if (NOMBRE_COMANDO && 'active' in COMANDO) {
            if (COMANDO.active) this.commands.set(COMANDO.ExpReg, COMANDO)
          }
        } catch (e) {
          console.log(`ERROR AL CARGAR EL COMANDO ${rutaArchivo}`.bgRed)
          console.log({ e })
        }
      })
      console.log(
        `(${BOT_PREFIX}) ${this.commands.size}  Comandos cargados`
          .green
      )
    }
  }

  getCommands () {
    return Array.from(this.commands)
  }

  findCommand (str) {
    const cmd = this.getCommands().find(([expreg]) => expreg.test(str))
    if (typeof cmd === 'undefined') {
      return [false, []]
    }
    return [true, cmd]
  }

  async loadHandlers () {
    console.log('(%) Cargando handlers'.yellow)

    const RUTA_ARCHIVOS = await this.utils.loadFiles('/lib/handlers')

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          require(rutaArchivo)(this)
        } catch (e) {
          console.log(`ERROR AL CARGAR EL HANDLER ${rutaArchivo}`.bgRed)
        }
      })
    }

    console.log(`(-) ${RUTA_ARCHIVOS.length} Handlers Cargados`.green)
  }

  async loadEvents () {
    console.log('(%) Cargando eventos'.yellow)

    const RUTA_ARCHIVOS = await this.utils.loadFiles('/lib/events')

    this.removeAllListeners()

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          const EVENTO = require(rutaArchivo)
          const NOMBRE_EVENTO = rutaArchivo
            .split('\\')
            .pop()
            .split('/')
            .pop()
            .split('.')
            .shift()
          this.on(NOMBRE_EVENTO, EVENTO.bind(null, this))
        } catch (e) {
          console.log({ e })
          console.log(`ERROR AL CARGAR EL EVENTO ${rutaArchivo}`.bgRed)
        }
      })
    }

    console.log(`(+) ${RUTA_ARCHIVOS.length} Eventos Cargados`.green)
  }
}
