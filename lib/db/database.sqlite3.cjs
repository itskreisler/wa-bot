const sqlite3 = require('sqlite3').verbose()
/**
 * @typedef {Object} DbOptionsTypes
 * @property {String} folder - Carpeta donde se guardara la base de datos
 * @property {String} file - Nombre del archivo de la base de datos
 */

/**
 * @typedef {Object} WhereCondition
 * @property {String} [igual] `=`
 * @property {String} [diferente] `!=`
 * @property {String} [mayorQue] `>`
 * @property {String} [menorQue] `<`
 * @property {String} [mayorIgualQue] `>=`
 * @property {String} [menorIgualQue] `<=`
 * @property {String} [like] `LIKE`
 */

/**
 * @typedef {Array<WhereCondition>} WhereQuery
 */

/**
 * @class DataBase
 * @extends sqlite3.Database
 * @example
 * // One insert
 * const query = await db
 * .insert('usuarios')
 * .values({
 *  name: 'pepito',
 *  createdAt: new Date().toLocaleString(),
 *  updatedAt: ''
 * })
 * .query()
 * @example
 * // Multiple insert
 * const query = await db
 * .insert('usuarios')
 * .values([{
 *  name: 'pepito',
 *  createdAt: new Date().toLocaleString(),
 *  updatedAt: ''
 * },
 * {
 *  name: 'juanito',
 *  createdAt: new Date().toLocaleString(),
 *  updatedAt: ''
 * }])
 * .query()
 * @example
 * // select
 * const query = await db
 * .select('*')
 * .from('usuarios')
 * .join([{ 'tablaprimaria.col': 'tablafor.col' }, { 'tablaprimaria2.col': 'tablafor2.col' }])
 * .where([{ '=': { usuarioId: 4 } }, { '=': { usuarioId: 3 } }], 'OR')
 * .query()
 * @example
 * // delete
 * const query = await db
 * .delete('usuarios')
 * .where([{ '=': { usuarioId: 4 } }, { '=': { usuarioId: 3 } }], 'OR')
 * .query()
 * @example
 * // update
 */

/* module.exports = */ class Db extends sqlite3.Database {
  #file
  #sql = ''
  #pdo
  #op = false
  /**
   *
   * @param {DbOptionsTypes} options - Opciones de la base de datos
   */
  constructor (
    options = {
      folder: './tmp/',
      file: 'bot_wa.db'
    }
  ) {
    super(options.folder + options.file)

    // this.run('DELETE FROM usuarios')

    this.run(`CREATE TABLE IF NOT EXISTS usuarios (
        usuarioId INTEGER PRIMARY KEY AUTOINCREMENT,
        usuarioFrom TEXT,
        createdAt TEXT,
        updatedAt TEXT
        )`)

    /* this.run(`INSERT INTO usuarios (usuarioFrom)
VALUES
  (:usuarioFrom0),
  (:usuarioFrom1)`, { ':usuarioFrom0': 'u0', ':usuarioFrom1': 'u1' }) */
  }

  count (array) {
    return array.length
  }

  select (query = '*') {
    if (Array.isArray(query) && this.count(query) > 0) {
      const columns = query.join(', ')
      this.#sql = `SELECT ${columns} FROM `
    } else {
      this.#sql =
        query === '*' || !Array.isArray(query)
          ? 'SELECT * FROM '
          : `SELECT ${query} FROM `
    }

    return this
  }

  insert (table = '') {
    this.#sql = `INSERT INTO ${table} `
    return this
  }

  delete (table = '') {
    this.#sql = `DELETE FROM ${table} `
    return this
  }

  update (table = '') {
    this.#sql = `UPDATE ${table} SET `
    return this
  }

  set (query) {
    if (Array.isArray(query)) {
      const tmp = []
      for (const key in query) {
        if (Object.prototype.hasOwnProperty.call(query, key)) {
          tmp.push(key)
          this.#pdo[key] = query[key]
        }
      }
      const set = tmp.map((valor) => {
        return `${valor} = :${valor}`
      })
      const columns = set.join(', ')
      this.#sql += columns
    }
    return this
  }

  #placeholder (claves, valores) {
    const placeholders = {}

    claves.forEach((clave, indice) => {
      const marcador = `:${clave}`
      placeholders[marcador] = valores[indice]
    })

    return placeholders
  }

  values (query) {
    const [claves, valores] = [Object.keys(query), Object.values(query)]
    if (Array.isArray(query)) {
      const listColumns = query.map((item) => Object.keys(item)).shift()
      const columns = listColumns.join(', ')
      const values = query
        .map((item, i) =>
          Object.keys(item)
            .map((key) => `:${key}${i}`)
            .join(', ')
        )
        .join('),(')

      // crear un objecto asi { ':usuarioFrom0': 'v0', ':usuarioFrom1': 'v1' }
      const params = query
        .map((item) => Object.values(item))
        .reduce((acc, cur, i) => {
          return cur.reduce((acc, cur, j) => {
            acc[`:${listColumns[j]}${i}`] = cur
            return acc
          }, acc)
        }, {})
      this.#pdo = params
      this.#sql += `(${columns}) VALUES (${values})`
    } else if (typeof query === 'object' && Object.keys(query).length > 0) {
      this.#pdo = this.#placeholder(claves, valores)
      const columns = `(${claves.join(', ')}) VALUES (${claves
        .map((valor) => `:${valor}`)
        .join(', ')})`
      this.#sql += columns
    }
    return this
  }

  from (query) {
    if (Array.isArray(query) && this.count(query) > 0) {
      this.#sql += query.join(', ')
    } else {
      this.#sql += query
    }

    return this
  }

  /**
   * @enum {Number|String}
   * @property {String} '=' - Igual
   * @property {String} '!=' - Diferente
   * @property {String} '>' - Mayor que
   * @property {String} '<' - Menor que
   * @property {String} '>=' - Mayor o igual que
   * @property {String} '<=' - Menor o igual que
   */
  /**
   * Realiza una consulta condicional utilizando la cláusula WHERE.
   *
   * @param {WhereQuery|WhereCondition} query - Objeto o arreglo con las condiciones
   * @param {String} condition - Condición de combinación (AND | OR)
   * @returns {Object} - Resultado de la consulta
   */
  where (query, condition = 'AND') {
    if (!query) return this
    this.#sql += this.#op ? ' AND ' : ' WHERE '
    if (Array.isArray(query) && this.count(query) > 0) {
      const params = query.reduce((acumulador, actual, indice) => {
        const val = Object.values(actual).shift()
        const clave = Object.keys(val).shift()
        acumulador[`:${clave}${indice}`] = val[clave]
        return acumulador
      }, {})
      this.#pdo = params
      const wheres = query
        .map((actual, indice) => {
          const key = Object.keys(actual).shift()
          const val = Object.values(actual).shift()
          const clave = Object.keys(val).shift()
          return `${clave} ${key} :${clave}${indice}`
        })
        .join(` ${condition} `)

      this.#sql += wheres
    } else if (
      typeof query === 'object' &&
      Object.keys(query || []).length > 0
    ) {
      const [claves, valores] = [Object.keys(query), Object.values(query)]
      const params = valores.reduce((acumulador, actual, indice) => {
        const key = Object.keys(actual).shift()
        const val = Object.values(actual).shift()
        acumulador[`:${key}${indice}`] = val
        return acumulador
      }, {})
      this.#pdo = params
      const wheres = claves
        .map((clave, index) => {
          const key = Object.keys(valores[index]).shift()
          return `${key} ${clave} :${key}${index}`
        })
        .join(` ${condition} `)
      this.#sql += wheres
    }

    return this
  }

  notIn (select, from, where = []) {
    this.#sql += ` NOT IN (SELECT ${select} FROM ${from} WHERE `

    if (Array.isArray(where) && where.length > 0) {
      let i = 1
      for (const key in where) {
        if (Object.prototype.hasOwnProperty.call(where, key)) {
          const temp = i === where.length ? '' : 'AND '
          this.#sql += `${key} = :${key} ${temp}`
          i++
        }
      }
      for (const key in where) {
        if (Object.prototype.hasOwnProperty.call(where, key)) {
          this.pdo[key] = where[key]
        }
      }
    }

    this.#sql += ')'

    return this
  }

  join (query) {
    if (Array.isArray(query) && this.count(query) > 0) {
      this.#op = true
      this.#sql += this.#op ? ' WHERE ' : ' '
      const relations = query
        .map((item) => {
          const [key, value] = [
            Object.keys(item).shift(),
            Object.values(item).shift()
          ]
          return `${key} = ${value}`
        })
        .join(' AND ')
      this.#sql += relations
    }

    return this
  }

  orderBy (query = [], order = 'ASC') {
    this.#sql += ` ORDER BY ${query.join(', ')} ${order}`
    return this
  }

  query () {
    return new Promise((resolve, reject) => {
      if (/^SELECT/.test(this.#sql)) {
        this.all(this.#sql, this.#pdo, function (err, rows) {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      } else {
        this.run(this.#sql, this.#pdo || null, function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(this.changes)
          }
        })
      }
    })
  }

  lastInsertId () {
    return new Promise((resolve, reject) => {
      this.run(this.#sql, this.#pdo, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(this.lastID)
        }
      })
    })
  }

  getSql () {
    console.log({ pdo: this.#pdo })
    return this.#sql
  }

  cerrarConexion () {
    this.close()
  }
}

(async () => {
  const db = new Db()
  const query = await db.delete('usuarios').where().query()

  console.log({ query })
})()
