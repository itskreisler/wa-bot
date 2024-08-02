const { configEnv: { BOT_USERNAME }, MarkdownWsp } = require('../../helpers/Helpers.cjs')
const { JSDOM } = require('jsdom')
const { MessageMedia } = require('whatsapp-web.js')
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
    const CRON_JOB = '0 */30 6-23 * * * *'
    const [, _accion] = match
    const accion = String(_accion).toLowerCase()
    console.log({ accion })
    // const { from } = msg
    // obtener el chat
    const chat = await msg.getChat()
    const { id: { _serialized }, isGroup } = chat
    if (!isGroup) {
      return await msg.reply('Este comando solo puede ser usado en grupos')
    }
    // const { $, $$ } = createDOMUtilities(data);
    /**
     * @typedef {Object} CaracolResponse
     * @property {string} url
     * @property {Record<string, string>} headers
     */
    /**
     * @typedef {Object} Caracol
     * @property {function(any, any, RequestInit): Promise<Response>} programacion
     */
    /**
     * @type {Caracol}
     */
    const caracoltv = createApi('https://www.caracoltv.com', { force: false })
    switch (accion) {
      case 'c':
      case 'caracol': {
        const response = await caracoltv.programacion()
        const data = await response.text()
        const { $$ } = createDOMUtilities(data)
        const programacion = [...$$('.ScheduleDay.today .ScheduleDay-info')].map(

          ele => ({
            title: ele.querySelector('.ScheduleDay-info-title').textContent,
            time: String(ele.querySelector('.ScheduleDay-time').textContent).replace(/(\n+)/g, '')
          }))
        const caption = programacion.map(
          ({ title, time }) => MarkdownWsp.blockQuote(`${title} a las ${time}`)
        ).join('\n')
        await client.sendMessage(_serialized, caption)
        break
      }
    }
  }
}
