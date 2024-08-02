const { configEnv: { BOT_USERNAME }, MarkdownWsp } = require('../../helpers/Helpers.cjs')
const { JSDOM } = require('jsdom')
// const { MessageMedia } = require('whatsapp-web.js')
const { createApi } = require('@kreisler/createapi')
/**
 * Crea un nuevo JSDOM a partir de los datos proporcionados y define funciones
 * para seleccionar elementos del DOM.
 *
 * @param {string} data - Los datos HTML para crear el DOM.
 * @returns {{ $: (selector: string) => Element | null, $$: (selector: string) => NodeListOf<Element> }}
 * Un objeto con dos funciones: `$` para `querySelector` y `$$` para `querySelectorAll`.
 */
function createDOMUtilities(data) {
  const dom = new JSDOM(data)

  /**
       * Selecciona un único elemento del DOM utilizando un selector.
       *
       * @param {string} selector - El selector CSS para el elemento.
       * @returns {Element | null} El primer elemento que coincide con el selector, o null si no hay coincidencias.
       */
  const $ = (selector) => dom.window.document.querySelector(selector)

  /**
       * Selecciona todos los elementos del DOM que coinciden con un selector.
       *
       * @param {string} selector - El selector CSS para los elementos.
       * @returns {NodeListOf<Element>} Una NodeList de elementos que coinciden con el selector.
       */
  const $$ = (selector) => dom.window.document.querySelectorAll(selector)

  return { $, $$ }
}
const banner = '*📺 Horario de Programación para Hoy 📺*\n\n'
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/pro(?:gramacion)?(?:_(\\w+))?(?:@${BOT_USERNAME})?$`, 'im'),
  /**
   * @description Comando para obtener la programacion de la tv caracol y rcn
   *
   * @param {import('../../core/Client.cjs')} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   * @param {RegExpMatchArray} match - Resultado de la expresion regular
   */
  async cmd(client, msg, match) {
    // const CRON_JOB = '0 */30 6-23 * * * *'
    const [, _accion] = match
    const accion = String(_accion).toLowerCase()
    // const { from } = msg
    // obtener el chat
    const chat = await msg.getChat()
    const { id: { _serialized }, isGroup } = chat
    if (!isGroup) {
      return await msg.reply('Este comando solo puede ser usado en grupos')
    }
    /**
     * @typedef {Object} ProgramTV
     * @property {function(any, any, RequestInit): Promise<Response>} programacion
     */
    /**
     * @type {ProgramTV}
     */
    const caracoltv = createApi('https://www.caracoltv.com', { force: false })
    /**
     * @type {ProgramTV}
     */
    const rcntv = createApi('https://www.canalrcn.com', { force: false })
    switch (accion) {
      case 'c':
      case 'caracol': {
        const response = await caracoltv.programacion()
        const data = await response.text()
        const { $$ } = createDOMUtilities(data)
        const programacion = [...$$('.ScheduleDay.today .ScheduleDay-Content-item')].map(
          ele => ({
            title: ele.querySelector('.ScheduleDay-info-title').textContent.trim(),
            time: String(ele.querySelector('.ScheduleDay-time').textContent.trim()).replace(/(\n+)/g, ''),
            poster: ele.querySelector('.ScheduleDay-media img').getAttribute('src')
          }))
        console.log({ programacion })
        const caption = programacion.map(
          ({ title, time }) => MarkdownWsp.blockQuote(`${title} - 🕒 ${time}\n`)
        ).join('\n')
        await client.sendMessage(_serialized, banner.concat(caption).concat(`
Miralo en vivo: https://www.caracoltv.com/senal-vivo
Consulta la programacion: https://www.caracoltv.com/programacion/
            `)).catch(console.error)
        break
      }
      case 'r':
      case 'rcn': {
        const response = await rcntv.programacion()
        const data = await response.text()
        const { $$ } = createDOMUtilities(data)
        const programacion = [...$$('[class="row programacion-item"]')].map(
          ele => ({
            title: ele.querySelector('.bloque-text h4').textContent.trim(),
            time: String(ele.querySelector('.bloque-hora').textContent.trim()),
            poster: ele.querySelector('.bloque-img img').getAttribute('src')
          }))
        console.log({ programacion })
        const caption = programacion.map(
          ({ title, time }) => MarkdownWsp.blockQuote(`${title} - 🕒 ${time}\n`)
        ).join('\n')
        await client.sendMessage(_serialized, banner.concat(caption).concat(`
Mira la señal en vivo: https://www.canalrcn.com/senal-en-vivo/
Consulta la programacion: https://www.canalrcn.com/programacion/`)).catch(console.error)
        break
      }
    }
  }
}
