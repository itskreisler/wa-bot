const { configEnv: { BOT_USERNAME }, MarkdownWsp } = require('../../helpers/Helpers.cjs')
const { createApi } = require('@kreisler/createapi')
const yamete = createApi('https://www3.animeflv.net')
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/k(?:udasai)?(?:@${BOT_USERNAME})?$`, 'im'),
  /**
   * Logica del comando
   *
   * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   */
  async cmd(client, msg) {
    const { from } = msg
    async function send(txt) { await client.sendMessage(from, txt) }
    /**
     * 
     * @param {import('whatsapp-web.js').Message} content 
     * @param {import('whatsapp-web.js').MessageSendOptions} opciones 
     */
    async function sendMSG(content, opciones) {
      const chat = await msg.getChat()
      await chat.sendMessage(content, opciones)
    }
    /**
     * @type {Blogs}
     */
    const data = await yamete['kudasai.php']()
    const url_base = "https://somoskudasai.com/"
    const blogs = data.map(({ category: { slug: catslug }, slug, title, date }) => {
      const link_post = `${url_base}${catslug}/${slug}/`
      const link_category = `${url_base}categoria/${catslug}/`
      return MarkdownWsp.blockQuote(`
🔥 ${title}
📅 ${date}
🔗 ${link_post}
🔗 ${link_category}
      `)
    }).join('\n\n')
    await sendMSG(blogs)
  }
}
/**
 * Tipo para representar una lista de blogs, que es un arreglo de posts.
 * @typedef {Post[]} Blogs
 */

/**
 * Interfaz que describe la estructura de un post en un blog.
 * @typedef {Object} Post
 * @property {string} title - El título del post.
 * @property {string} image - La URL de la imagen asociada al post.
 * @property {string} slug - El slug único del post para identificación en la URL.
 * @property {string} date - La fecha de publicación del post en formato de cadena.
 * @property {Category} category - La categoría a la que pertenece el post.
 */

/**
 * Interfaz que describe la estructura de una categoría.
 * @typedef {Object} Category
 * @property {string} name - El nombre de la categoría.
 * @property {string} slug - El slug único de la categoría para identificación en la URL.
 */
