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
 * const query = await db
 * .update('usuarios')
 * .set([{ usuarioFrom: 'name' }, { updatedAt: new Date().toLocaleString() }])
 * .where({ '=': { usuarioId: 1234567890 } })
 * .query()
 * @example
 * // update 2
 * const query = await db
 * .update('usuarios')
 * .set({ usuarioFrom: 'name' })
 * .set({ updatedAt: new Date().toLocaleString() })
 * .where({ '=': { usuarioId: 1234567890 } })
 * .query()
 */

class Db extends sqlite3.Database {
  #sql = ''
  #pdo
  #op = false
  #set = []
  #sqlWheres = ''
  #sqlValues = ''
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
    // tabla usuarios
    this.run(`CREATE TABLE IF NOT EXISTS usuarios (
        usuarioId INTEGER PRIMARY KEY AUTOINCREMENT,
        usuarioFrom TEXT,
        usuarioToken TEXT,
        usuarioConfig TEXT,
        usuarioCreatedAt TEXT,
        usuarioUpdatedAt TEXT
        )`)
    // tabla registros
    this.run(`CREATE TABLE IF NOT EXISTS registros (
      registroId INTEGER PRIMARY KEY AUTOINCREMENT,
      registroTitle TEXT,
      registroConfig TEXT,
      registrocreatedAt TEXT,
      registroupdatedAt TEXT,
      usuarioId_Usuarios INTEGER,
      FOREIGN KEY (usuarioId_Usuarios) REFERENCES usuarios(usuarioId)
        )`)
    // tabla tareas
    this.run(`CREATE TABLE IF NOT EXISTS tareas (
      tareaId INTEGER PRIMARY KEY AUTOINCREMENT,
      registroId_Registros INTEGER,
      tareaTitle TEXT,
      tareaStatus INTEGER,
      tareaConfig TEXT,
      tareaCreatedAt TEXT,
      tareaUpdatedAt TEXT,
      FOREIGN KEY (registroId_Registros) REFERENCES registros(registroId)
        )`)
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
    const [claves, valores] = [Object.keys(query), Object.values(query)]
    if (Array.isArray(query) && this.count(query) > 0) {
      console.log(query)
      const set = query.map((item, i) => {
        const [claves, valores] = [Object.keys(item), Object.values(item)]
        const params = this.#placeholder(claves, valores)
        this.#pdo = { ...this.#pdo, ...params }
        return claves.map((valor) => {
          return `${valor} = :${valor}`
        }).shift()
      })
      this.#set = set
    } else if (typeof query === 'object' && Object.keys(query).length > 0) {
      this.#pdo = { ...this.#pdo, ...this.#placeholder(claves, valores) }
      const set = claves.map((valor) => {
        return `${valor} = :${valor}`
      }).shift()
      this.#set.push(set)
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

  /**
   * @param {object.<{hola:string}>} query
   *
   */
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
      this.#sqlValues = `(${columns}) VALUES (${values})`
      // this.#sql += `(${columns}) VALUES (${values})`
    } else if (typeof query === 'object' && Object.keys(query).length > 0) {
      this.#pdo = this.#placeholder(claves, valores)
      const columns = `(${claves.join(', ')}) VALUES (${claves
        .map((valor) => `:${valor}`)
        .join(', ')})`
      this.#sqlValues = columns
      // this.#sql += columns
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
   * Realiza una consulta condicional utilizando la cláusula WHERE.
   *
   * @param {WhereQuery|WhereCondition} query - Objeto o arreglo con las condiciones
   * @param {String} condition - Condición de combinación (AND | OR)
   * @returns {Object} Resultado de la consulta
   */
  where (query, condition = 'AND') {
    if (!query) return this
    if (Array.isArray(query) && this.count(query) > 0) {
      const params = query.reduce((acumulador, actual, indice) => {
        const val = Object.values(actual).shift()
        const clave = Object.keys(val).shift()
        acumulador[`:${clave}${indice}`] = val[clave]
        return acumulador
      }, {})
      this.#pdo = { ...this.#pdo, ...params }
      const wheres = query
        .map((actual, indice) => {
          const key = Object.keys(actual).shift()
          const val = Object.values(actual).shift()
          const clave = Object.keys(val).shift()
          return `${clave} ${key} :${clave}${indice}`
        })
        .join(` ${condition} `)

      // this.#sql += wheres
      this.#sqlWheres = wheres
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
      this.#pdo = { ...this.#pdo, ...params }
      const wheres = claves
        .map((clave, index) => {
          const key = Object.keys(valores[index]).shift()
          return `${key} ${clave} :${key}${index}`
        })
        .join(` ${condition} `)
      // this.#sql += wheres
      this.#sqlWheres = wheres
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

  query (queryBuilder, params) {
    this.#setStatement()
    if (queryBuilder) {
      this.#sql = queryBuilder
      this.#pdo = params || null
    }
    return new Promise((resolve, reject) => {
      const execClean = this.cleanStatement.bind(this)
      if (/^select/gim.test(this.#sql)) {
        this.all(this.#sql, this.#pdo, function (err, rows) {
          execClean()
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      } else {
        this.run(this.#sql, this.#pdo, function (err) {
          execClean()
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
    this.#setStatement()
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

  cleanStatement () {
    this.#op = false
    this.#set = []
    this.#sql = ''
    this.#sqlWheres = ''
    this.#sqlValues = ''
    this.#pdo = null
  }

  #setStatement () {
    if (this.#sqlValues) {
      this.#sql += this.#sqlValues
    } else {
      if (this.count(this.#set) > 0) {
        this.#sql += this.#set.join(', ')
      }
      if (this.#sqlWheres) {
        this.#sql += this.#op ? ' AND ' : ' WHERE '
      }
      this.#sql += this.#sqlWheres
    }
  }

  getSql () {
    this.#setStatement()
    console.log({ pdo: this.#pdo })
    return this.#sql
  }

  cerrarConexion () {
    this.close()
  }
}

module.exports = Db
module.exports.Db = Db

/* (async () => {
  const db = new Db()
  // const query = await db.query('SELECT * FROM usuarios WHERE usuarioId = :usuarioId', { ':usuarioId': 1 })
  const query = await db
    .insert('usuarios')
    .values({
      usuarioId: 573052547705,
      usuarioFrom: 'kley',
      createdAt: new Date().toLocaleString(),
      updatedAt: ''
    })
    .query()
  console.log({ query })
})() */
/* (async () => {
  const db = new Db()
  const query = await db.update('usuarios')
    .set([{ usuarioFrom: 'name' }, { updatedAt: new Date().toLocaleString() }])
    .where({ '=': { usuarioId: 573052547705 } })
    .query()
  console.log({ query })
})() */
/* (async () => {
  const db = new Db()
  // select
  const query = await db
    .select()
    .from('usuarios')
    .where([{ '=': { usuarioId: 573052547705 } }])
    .getSql()
  console.log({ query })
})() */
