/** ¨
 * @typedef {object} TypesArgs
 * @property {boolean} [debug=false] - Debug mode
 */

/**
 * @name createApi
 * @description Create an API
 * @param {string} url
 * @param {RequestInit|TypesArgs} args
 * @returns {object}
 * @example
 * const api = createApi('https://nekobot.xyz/api')
 * const res = await api.image({ type: 'neko' })
 * console.log({ res })
 *
 *
 */

function createApi (url, args) {
  return new Proxy({}, {
    get: function (target, prop, receiver) {
      return async (id, params) => {
        let query
        let path = [url, prop].join('/')
        const typeOfId = typeof id
        if (typeOfId === 'object') {
          query = typeOfId !== 'undefined' ? ['?', new URLSearchParams(id).toString()] : []
          path = path.concat(...query)
        }
        if (['string', 'number'].some(tof => typeOfId === tof) || typeof params !== 'undefined') {
          query = typeof params !== 'undefined' ? ['?', new URLSearchParams(params).toString()] : []
          path = [path, id].join('/').concat(...query)
        }
        if (args?.debug) return { prop, path, id, params, args }
        const res = await globalThis.fetch(path, args)
        try {
          return res.json()
        } catch (error) {
          throw new Error(error)
        }
      }
    }
  })
}
module.exports = createApi
module.exports.createApi = createApi
