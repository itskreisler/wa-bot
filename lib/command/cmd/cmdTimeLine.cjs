const { configEnv: { BOT_USERNAME }, MarkdownWsp: { monoespaciado } } = require('../../helpers/Helpers.cjs')

const { MessageMedia } = require('whatsapp-web.js')
const BASE_URL = 'https://paimon.moe'
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/t(?:ime)?l(?:ine)?(?:_(\\w+))?(?:@${BOT_USERNAME})?$|^/p(?:aimon)?(?:_(\\w+))?(?:@${BOT_USERNAME})?$`, 'im'),
  /**
   * Logica del comando
   *
   * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   */
  async cmd(client, msg, match) {
    const { from } = msg
    let [, command, cmdSecond] = match
    command = command || cmdSecond
    //
    const imgTimeLine = 'timeline.png'
    const imgResina = 'resina.png'

    async function generateImage() {
      console.log("iniciando navegador");
      const { chromium } = require('playwright')
      const btnTimeline = '[href="/timeline"]'
      const slcServer = '[class^="select-none relative w-64 svelte"] [class^="flex w-full relative items-center px-4 bg-background rounded-2xl h-14 focus:outline-none focus:border-primary border-2 border-transparent ease-in duration-100 cursor-pointer border-transparent svelte"]'
      const opAmerica = '[class^="bg-item rounded-2xl absolute mt-2 p-2 w-full z-50 flex flex-col text-white shadow-xl border border-background"] > span:nth-child(2)'
      const isPageTimeLine = '[class^="absolute rounded-xl top-0 text-center bg-white text-black svelte"]'
      console.log("navegando a la pagina");
      const browser = await chromium.launch()
      console.log("pagina abierta");
      const page = await browser.newPage()
      await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' })
      console.log("pagina cargada");
      await page.waitForTimeout(2000)
      console.log("Abriendo servidores");
      await page.waitForSelector(slcServer)
      await page.click(slcServer)
      await page.waitForTimeout(2000)
      console.log("Seleccionando servidor America");
      await page.waitForSelector(opAmerica)
      await page.click(opAmerica)
      console.log("Navegando a timeline");
      await page.waitForSelector(btnTimeline)
      console.log("Cargando timeline");
      await page.click(btnTimeline)
      await page.waitForSelector(isPageTimeLine)
      console.log("Capturando imagen");
      //await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await page.screenshot({ path: `./tmp/${imgTimeLine}` })
      console.log("imagen guardada");
      await browser.close()
      console.log("cerrando navegador");
    }
    async function capturarRegion(url, selector, rutaArchivo) {
      // Inicia el navegador Chromium (puedes cambiarlo a 'firefox' o 'webkit' si lo prefieres)
      const { chromium } = require('playwright')
      const browser = await chromium.launch()
      // Crea una nueva página
      const pagina = await browser.newPage()
      try {
        // Navega a la URL proporcionada
        const btnInicio = '[href="/"][class="relative py-2"]'
        const slcServer = '[class^="flex w-full relative items-center px-4 bg-background rounded-2xl h-14 focus:outline-none focus:border-primary border-2 border-transparent ease-in duration-100 cursor-pointer border-transparent svelte"]'
        const opAmerica = '[class^="bg-item rounded-2xl absolute mt-2 p-2 w-full z-50 flex flex-col text-white shadow-xl border border-background"] > span:nth-child(2)'
        console.log('Navegando a configuraciones...')
        await pagina.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' })
        console.log('Seleccionando servidor...')
        await page.waitForTimeout(2000)
        await pagina.waitForSelector(slcServer)
        await pagina.click(slcServer)
        console.log('Seleccionando servidor America...')
        await page.waitForTimeout(2000)
        await pagina.waitForSelector(opAmerica)
        await pagina.click(opAmerica)
        console.log('Navegando a inicio...')
        await pagina.waitForSelector(btnInicio)
        await pagina.click(btnInicio)
        console.log(`Navegando a la URL: ${url}...`)
        // await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })

        // Espera a que el selector esté visible y sea interactuable
        await pagina.waitForSelector(selector)
        console.log(`Capturando la región de la pantalla: ${selector}...`)
        // Espera 2 segundos para que se cargue el contenido
        await pagina.waitForTimeout(2000)
        console.log('Capturando la región de la pantalla...')
        // Captura una imagen de la región especificada
        await pagina.locator(selector).screenshot({ path: rutaArchivo })
        // Captura una imagen de la región especificada

        console.log(`Captura de pantalla de la región realizada y guardada en: ${rutaArchivo}`)
      } catch (error) {
        console.error('Error al capturar la región de la pantalla:', error)
      } finally {
        // Cierra el navegador al finalizar
        await browser.close()
        console.log("cerrando navegador");
      }
    }
    //
    switch (command) {
      case 'img':
      case 'image':
      case 'tl':
      case 'timeline':
        (async () => {
          await generateImage()
          const media = MessageMedia.fromFilePath(`./tmp/${imgTimeLine}`)
          client.sendMessage(from, media, { caption: `Imagen actualizada\n${BASE_URL}/timeline` })
        })()
        break
      case 'r':
      case 'resina':
        (async () => {
          const cardResina = '#sapper > main > div > div > div[class="bg-item rounded-xl p-4 flex flex-col"]:nth-child(6)'
          const filePath = `./tmp/${imgResina}`
          await capturarRegion(BASE_URL.concat('/'), cardResina, filePath)
          const media = MessageMedia.fromFilePath(filePath)
          client.sendMessage(from, media, { caption: `Pongase a farmear\n${BASE_URL}` })
        })()
        break
      default:
        (async () => {
          const helpComandos = `
${monoespaciado('Lista de comandos de /paimon')}

/paimon - Muestra este mensaje
/paimon_tl
/paimon_timeline
/paimon_r
/paimon_resina
`
          client.sendMessage(from, helpComandos)
        })()
        break
    }
  }
}
