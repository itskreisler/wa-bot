const { configEnv: { BOT_USERNAME } } = require('../../helpers/Helpers.cjs')
const createApi = require('../../helpers/create.api.cjs')
const { MessageMedia } = require('whatsapp-web.js')
const jsGoogleTranslateFree = require('@kreisler/js-google-translate-free')
const { cursiva, negrita, monoespaciado } = {
  cursiva: (text) => `_${text}_`,
  negrita: (text) => `*${text}*`,
  tachado: (text) => `~${text}~`,
  monoespaciado: (text) => `\`\`\`${text}\`\`\``
}
const MAL_API = 'https://api.jikan.moe/v4'
module.exports = {
  active: true,
  OWNER: false,
  ExpReg: new RegExp(`^/anime(?:_(\\w+))?(?:@${BOT_USERNAME})?(?:\\s+(.+))?$`, 'ims'),
  /**
   * Logica del comando
   *
   * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   * @param {RegExpMatchArray} match - Resultado de la expresion regular
   */
  async cmd (client, msg, match) {
    const { from, id: { _serialized: quotedMessageId } } = msg
    const [, accion, q] = match
    // funcion para enviar mensajes
    function sendMessage (sms) {
      client.sendMessage(from, sms, { quotedMessageId })
    }
    switch (accion) {
      case 'search':
        (async () => {
          if (!q) {
            sendMessage(`Debes escribir el nombre del anime a buscar.\nEjemplo:\n/anime_search ${negrita('konosuba')}`)
            return
          }
          const malApi = createApi(MAL_API)
          const response = await malApi.anime({ q, limit: 10 })
          const { data } = response
          if (data.length === 0) {
            sendMessage(`No se encontraron resultados para ${negrita(cursiva(q))}`)
            return
          }
          const resultado = data.map(({ mal_id: malId, title, year, type, episodes }) => monoespaciado(`
🆔 MAL_ID: ${malId}
🔥 TITLE: ${title}
✔️ Episodios: ${episodes || 'N/A'}
✔️ Año: ${year | 'N/A'}
✔️ Format: ${type || 'N/A'}
`))
          const message = `
Resultado de la busqueda: _${q}_\n
${resultado.join('\n')}
          `
          sendMessage(message)
        })()
        break
      case 'byid':
        (async () => {
          if (!q) {
            sendMessage(`Debes escribir el id del anime a buscar.\nEjemplo:\n/anime_byid ${negrita('1')}`)
            return
          }
          const malApi = createApi(MAL_API)
          const response = await malApi.anime(q)
          if (response?.status) {
            sendMessage(`No se encontraron resultados para ${negrita(cursiva(q))}`)
            return
          }
          const { data } = response
          const { images: { jpg: { large_image_url: largeImageUrl } }, url, episodes, title, year, genres, synopsis, type, source, duration, season, themes } = data
          const translation = await jsGoogleTranslateFree.translate('en', 'es', synopsis)
          const media = await MessageMedia.fromUrl(largeImageUrl)
          const caption = `
🔥 Título: ${monoespaciado(title)}
✔️ Temporada: ${season || 'N/A'}
✔️ Géneros: ${genres?.map(({ name }) => name).join(', ') || 'N/A'}
✔️ Categorías: ${themes?.map(({ name }) => name).join(', ') || 'N/A'}
✔️ Episodios: ${episodes || 'N/A'}
✔️ Duración del episodio: ${duration || 'N/A'}
✔️ Año: ${year | 'N/A'}
✔️ Format: ${type || 'N/A'}
✔️ Fuente: ${source}
🔰 Sinopsis: 
${translation || 'N/A'}...
🌐 Url: ${url}`
          client.sendMessage(from, media, { caption })
        })()
        break
      default:
        sendMessage(`
${cursiva('Comandos disponibles:')}
${monoespaciado('/anime_search TITLE')} - Busca un anime por su nombre
${monoespaciado('/anime_byid MAL_ID')} - Busca un anime por su id
        `)
        break
    }
  }
}

/**
 * @typedef {"tv"|"movie"|"ova"|"special"|"ona"|"music"} TypesGetAnimeSearchType
 * @typedef {"airing"| "complete"|"upcoming"} TypesGetAnimeSearchStatus
 * @typedef {"mal_id"| "title"| "type"| "rating"| "start_date"| "end_date"| "episodes"| "score"| "scored_by"| "rank"| "popularity"| "members"| "favorites"} TypesGetAnimeSearchOrderBy
 * @typedef {"desc"|"asc"} TypesGetAnimeSearchSort
 */
/**
 * Ratings
 * `G - All Ages`
 * `PG - Children`
 * `PG-13 - Teens 13 or older`
 * `R - 17+ (violence & profanity)`
 * `R+ - Mild Nudity`
 * `Rx - Hentai`
 * @typedef {"g"|"pg"|"pg13"|"r17"|"r"|"rx"} TypesGetAnimeSearchRating
 */

/**
 * @typedef {Object} TypesGetAnimeSearch
 * @property {boolean} [sfw=false] default: false
 * @property {boolean} [unapproved=false]
 * @property {number} [page]
 * @property {string} [limit]
 * @property {string} [q]
 * @property {TypesGetAnimeSearchType} [type] - Enum: "tv" "movie" "ova" "special" "ona" "music"
 * @property {number} [score]
 * @property {number} [min_score]
 * @property {number} [max_score]
 * @property {TypesGetAnimeSearchStatus} [status] - Enum: "airing" "complete" "upcoming"
 * @property {string} [rating] - Enum: "g" "pg" "pg13" "r17" "r" "rx"
 * @property {string} [genres]
 * @property {string} [genres_exclude]
 * @property {TypesGetAnimeSearchOrderBy} [order_by] - Enum: "mal_id" "title" "type" "rating" "start_date" "end_date" "episodes" "score" "scored_by" "rank" "popularity" "members" "favorites"
 * @property {TypesGetAnimeSearchSort} [sort] - Enum: "desc" "asc"
 * @property {string} [letter]
 * @property {string} [producers]
 * @property {string} [start_date] - Filter by starting date. Format: YYYY-MM-DD. e.g `2022`, `2005-05`, `2005-01-01`
 * @property {string} [end_date] - Filter by ending date. Format: YYYY-MM-DD. e.g `2022`, `2005-05`, `2005-01-01`
 *
 *
 */
/**
 * @param {TypesGetAnimeSearch} [args]
 *
 */
// const getAnimeSearch = (args) => {}
