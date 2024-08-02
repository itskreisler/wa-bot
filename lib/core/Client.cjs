const { Client, LocalAuth } = require('whatsapp-web.js')
const cron = require('node-cron')
const { configEnv: { BOT_PREFIX, NODE_ENV } } = require('../helpers/Helpers.cjs')
const BotUtils = require('./Utils.cjs')
// const Database = require('../db/database.sqlite3.cjs')
const puppeteer = NODE_ENV === 'development'
  ? {
      executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-dev-shm-usage'
      ]
    }
  : { headless: true }
/**
 * @type {import('whatsapp-web.js').Client}
 */
module.exports = class extends Client {
  commands = new Map()
  config = { timezone: 'America/Bogota' }
  // Objeto que almacenará las tareas
  tasks = {}
  /**
   * @type {boolean} default: false
   */
  ALERT_NEW_EPISODES = false
  ALERT_NEW_EPISODES_LAT = false
  upTime
  /**
   * //@type {import('../db/database.sqlite3.cjs')}
   * @type {ClientDb}
   */
  db
  latanime
  /**
   *
   * @param {import("whatsapp-web.js").ClientOptions} options
   */
  constructor(
    options = {
      /* webVersion: '2.2412.50',
      webVersionCache: { type: "local" }, */
      /* webVersion: '2.2409.2',
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2409.2.html',
      }, */
      authStrategy: new LocalAuth(),
      puppeteer
    }
  ) {
    super({
      ...options
    })

    // this.db = new Database()
    this.db = {}
    this.db.latanime = {}
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
  async sendMediaGroupTenByTen(chatId, images, options = {}) {
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

  /**
   * @description Función para crear una tarea
   * @param {string} taskName
   * @param {string} schedule
   * @param {Function} callback
   * @returns
   * @example
   * createTask('tarea', '*\/10 * * * * *', () => console.log('Hola'))
   */
  createTask(taskName, schedule, callback) {
    // Verificar si la expresión de cron es válida
    let sms = ''
    if (!cron.validate(schedule)) {
      sms = `La expresión "${schedule}" no es válida.`
      console.log(sms)
      return [false, sms]
    }
    // Verificar si ya existe una tarea con ese nombre
    if (this.tasks[taskName]) {
      sms = `La tarea "${taskName}" ya existe.`
      console.log(sms)
      return [false, sms]
    }
    const { timezone } = this.config
    // Crear la tarea usando node-cron
    const task = cron.schedule(schedule, callback, { timezone, name: taskName, runOnInit: true })

    // Almacenar la tarea en el objeto de tareas
    this.tasks[taskName] = task
    sms = `Tarea "${taskName}" creada con éxito.`
    console.log(sms)
    return [true, sms]
  }

  /**
   * Función para destruir una tarea
   * @param {string} taskName
   * @returns
   */
  destroyTask(taskName) {
    let sms = ''
    // Verificar si la tarea existe
    const task = this.tasks[taskName]
    if (!task) {
      sms = `La tarea "${taskName}" no existe.`
      console.log(sms)
      return [false, sms]
    }

    // Detener y eliminar la tarea
    task.stop()
    delete this.tasks[taskName]
    sms = `Tarea "${taskName}" destruida con éxito.`
    console.log(sms)
    return [true, sms]
  }

  async start() {
    await this.loadEvents()
    await this.loadHandlers()
    await this.loadCommands()
  }

  async loadCommands() {
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

  getCommands() {
    return Array.from(this.commands)
  }

  findCommand(str) {
    const cmd = this.getCommands().find(([expreg]) => expreg.test(str))
    if (typeof cmd === 'undefined') {
      return [false, []]
    }
    return [true, cmd]
  }

  async loadHandlers() {
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

  async loadEvents() {
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
/**
 * @typedef {Object} LatAnime
 * @property {string} url
 * @property {string} chapter
 * @property {string} id
 * @property {string} episode
 * @property {string} title
 */
/**
 * @typedef {Object} ClientDb
 * @property {Object} latanime
 */
