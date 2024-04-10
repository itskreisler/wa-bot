const respuestas = require('./respuestas.cjs')

/**
 * @private
 * @typedef {object} MarkdownWspTypes
 * @property {Function} cursiva - Devuelve un texto en cursiva
 * @property {Function} negrita - Devuelve un texto en negrita
 * @property {Function} tachado - Devuelve un texto tachado
 * @property {Function} monoespaciado - Devuelve un texto monoespaciado
 * @property {Function} blockQuote - Devuelve un texto con formato de cita
 * @property {Function} bulletedLists - Devuelve una lista con viñetas
 * @property {Function} numberedLists - Devuelve una lista numerada
 * @property {Function} codeQuote - Devuelve un texto con formato de código
 * @property {Function} numberedListsV2 - Devuelve una lista numerada
 */

/**
 * Variables de entorno
 *
 * @private
 * @typedef  {object} ConfigEnvTypes
 * @property {String} BOT_PREFIX - Prefijo del bot
 * @property {String} BOT_USERNAME - Nombre de usuario del bot
 * @property {String} NODE_ENV - Entorno de ejecución
 * @property {String} AUTHORIZED_USERS - Usuarios autorizados
 * @property {String} OPENAI_API_KEY - API Key de OpenAI
 * @property {String} MAXSIZEBYTES - Tamaño máximo de archivo
 */

/**
 * @private
 * @typedef {object} HelpersTypes
 * @property {Function} jsonPrettier - Devuelve un JSON formateado
 * @property {ConfigEnvTypes} configEnv - Variables de entorno
 * @property {Array} owners - Dueños del bot
 * @property {Array} ownersId - ID de los dueños del bot
 * @property {Function} validateDomainTikTok - Valida el dominio de TikTok
 * @property {Object} ParseMode - Modos de parseo
 * @property {Function} isNull - Valida si un valor es nulo
 * @property {Function} isArrayEmpty - Valida si un array está vacío
 * @property {Function} abbreviateNumber - Abrevia un número
 * @property {Function} converterMb - Convierte bytes a MB
 * @property {Function} randomAnswer - Devuelve una respuesta aleatoria
 * @property {Function} getRandomInt - Devuelve un número aleatorio
 * @property {Function} shuffleArray - Mezcla un array
 * @property {Function} arrayShuffle - Otra forma de mezclar un array
 * @property {Function} stripHtmlTags - Elimina las etiquetas HTML
 * @property {Function} trimText - Elimina los espacios en blanco y saltos de línea
 * @property {MarkdownWspTypes} MarkdownWsp - Devuelve un texto con formato de Whatsapp
 *
 */

/**
 * @type {HelpersTypes}
 */
module.exports = {
  jsonPrettier: (json) => JSON.stringify(json, null, 2),
  configEnv: { ...process.env },
  owners: process.env?.AUTHORIZED_USERS?.split(',').map((admins) => {
    const [user, id] = admins.split(':')
    return [user, parseInt(id)]
  }),
  ownersId: process.env?.AUTHORIZED_USERS?.split(',').map((admins) => {
    const [, id] = admins.split(':')
    return parseInt(id)
  }),
  validateDomainTikTok(url) {
    const [, , domain] = url.split('/')
    const array = ['www.tiktok.com', 'vm.tiktok.com']
    return array.some((e) => e === domain)
  },
  ParseMode: Object.freeze({ Markdown: 'Markdown', MarkdownV2: 'MarkdownV2', HTML: 'HTML' }),
  isNull(_) {
    return (typeof valor === 'object' && _ === null) || Object.is(_, null)
  },
  isArrayEmpty(array) {
    return Array.isArray(array) && array.length === 0
  },
  abbreviateNumber(number) {
    const abbreviations = ['k', 'M', 'B', 'T']
    for (let i = abbreviations.length - 1; i >= 0; i--) {
      const abbreviation = abbreviations[i]
      const abbreviationValue = Math.pow(10, (i + 1) * 3)
      if (number >= abbreviationValue) {
        return `${(number / abbreviationValue).toFixed(1)}${abbreviation}`
      }
    }
    return number.toString()
  },
  converterMb(size) {
    return (size / 1024 / 1024).toFixed(2)
  },
  randomAnswer() {
    return respuestas[Math.floor(Math.random() * respuestas.length)]
  },
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
  },
  shuffleArray(array) {
    return array.reduce((shuffled, _, index) => {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
      return shuffled
    }, [...array])
  },
  arrayShuffle(array) {
    return array.sort(() => Math.random() - 0.5)
  },
  stripHtmlTags(str, exp = /<[^>]*>/g) {
    if ((str === null) || (str === '') || typeof str === 'undefined') { return String('') } else { str = str.toString() }
    return str.replace(exp, '')
  },
  trimText: (str) => str.replace(/^\s*\n/gm, '').replace(/^\s*|\s*$|\s+(?=\s)/gm, ''),
  MarkdownWsp: {
    cursiva: (text) => `_${text}_`,
    negrita: (text) => `*${text}*`,
    tachado: (text) => `~${text}~`,
    /**
     * 
     * @param {String} text 
     * @returns {String} Ejemplo: ```Hola mundo```
     */
    monoespaciado: (text) => `\`\`\`${text}\`\`\``,
    /**
     * 
     * @param {String} text 
     * @returns {String} Ejemplp: `> Hola mundo`
     */
    blockQuote: (text) => `> ${text}`,
    /**
     * 
     * @param {Array|String} text 
     * @returns {String}
     */
    bulletedLists: (text) => Array.isArray(text) ? text.map((t) => `- ${t}`).join('\n') : `- ${text}`,
    /**
     * 
     * @param {Array|String} text 
     * @returns {String}
     */
    numberedLists: (text) => Array.isArray(text) ? text.map((t, i) => `${i + 1}. ${t}`).join('\n') : `${text}`,
    numberedListsV2,
    codeQuote: (text) => `\`${text}\``,
  }

}

/**
 * 
 * @param {String} textoInicial
 * @returns {Object}
 * @example
 * const resultado = numberedLists("hola").numberedLists("mundo").toString(); 
 * console.log(resultado); // 1. hola\n2. mundo
 */
function numberedListsV2(textoInicial) {
  const isUndefined = typeof textoInicial === 'undefined';
  const isEmpty = !textoInicial?.trim()?.length;
  if (isUndefined) {
    throw new Error('El texto inicial es requerido');
  }
  if (isEmpty) {
    throw new Error('El texto inicial no puede estar vacio');
  }

  let listaNumerada = [textoInicial];

  const objeto = {
    numberedLists: (nuevoTexto) => {
      if (typeof nuevoTexto === 'undefined') {
        throw new Error('El texto es requerido');
      }
      if (!nuevoTexto?.trim()?.length) {
        throw new Error('El texto no puede estar vacio');
      }
      listaNumerada.push(nuevoTexto);
      return objeto;
    }
  };

  objeto.toString = function () {
    return listaNumerada.map((texto, index) => `${index + 1}. ${texto}`).join('\n');
  };

  return objeto;
};