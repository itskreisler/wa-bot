const { JSDOM } = require('jsdom')
const axios = require('axios')
const baseUrlStickerLy = Object.freeze({
  path: 'https://sticker.ly',
  user: '/user/',
  sticker: '/s/'
})
// ━━ TYPE DEFINITIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * Parametros de la funcion
 *
 * @private
 * @typedef  {object} StickerLyParams
 * @property {String} username - Nombre de usuario
 */

/**
 * @param {StickerLyParams} - nombre de usuario
 * @return {Promise<{status:Number,cover:String,followersCount:String,usernameText:String,description:String,linkProfile:String,avatar:String,stickerListBox:Array<{sticker:String,pack:String}>,topStickers:Array<{namePack:String,usernameMaker:String,areaBoxImage:Array<{sticker:String,pack:String}>}>}>}
 */
const getStickerlyInfo = async ({ username }) => {
  return new Promise((resolve, reject) => {
    const user = `${baseUrlStickerLy.path}${baseUrlStickerLy.user}${username}`
    let peticion;
    (async () => {
      try {
        peticion = await axios.get(user)
      } catch (e) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          error: 'No se pudo obtener la información del usuario',
          status: e.response.status
        })
        return
      }
      const { data } = peticion
      const dom = new JSDOM(data)
      const $ = (selector) => dom.window.document.querySelector(selector)
      const $All = (selector) => dom.window.document.querySelectorAll(selector)
      const usernameText = $('.this_text')?.textContent.trim()
      const description =
        $('.info_text')?.textContent.trim() || 'No hay descripción'
      const followersCount = $('.followers_count')?.textContent.trim()
      const linkProfile = $('.link_text')?.textContent.trim()
      const avatar = $('[alt="profile image"]')?.src
      const cover = $('[alt="cover image"]')?.src
      const stickerListBox = [...$All('.sticker_list_box li img')].map(
        (item) => ({
          sticker: item.src,
          pack:
            baseUrlStickerLy.path +
            baseUrlStickerLy.sticker +
            item.src.split('/')[5]
        })
      )

      const topStickers = [...$All('ul.area_stickers_list li.card')].map(
        (item) => {
          const namePack = item
            .querySelector('.this_name_pack')
            ?.textContent.trim()
          const usernameMaker = item
            .querySelector('.this_name_maker')
            ?.textContent.trim()
          const areaBoxImage = [
            ...item.querySelectorAll('ul.area_box_image li img')
          ].map((item) => ({
            sticker: item.src,
            pack:
              baseUrlStickerLy.path +
              baseUrlStickerLy.sticker +
              item.src.split('/')[5]
          }))
          return { namePack, usernameMaker, areaBoxImage }
        }
      )
      resolve({
        status: 200,
        cover,
        followersCount,
        usernameText,
        description,
        linkProfile,
        avatar,
        stickerListBox,
        topStickers
      })
    })()
  })
}
module.exports = { getStickerlyInfo, baseUrlStickerLy }
