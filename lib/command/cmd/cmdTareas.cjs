const {
  configEnv: { BOT_USERNAME },
  isArrayEmpty
} = require('../../helpers/Helpers.cjs')
const ArrayTrim = (item) => item.trim()
const actions = Object.freeze({
  create: 'create',
  save: 'save',
  delete: 'delete',
  view: 'view',
  read: 'read',
  update: 'update',
  random: 'random',
  restore: 'restore'
})
module.exports = {
  active: true,
  /**
   * Definición de una expresión regular para el comando `/tarea`. La expresión regular se usa para hacer coincidir la sintaxis del comando y extraer los parámetros pasados con el comando.
   */
  ExpReg: new RegExp(
    `^/tarea(?:@${BOT_USERNAME})?(?:_(\\w+))?(?:=(\\w+))?(?:=(\\d+))?(?:\\s+(.+))?$`,
    'mis'
  ),
  /**
   * Logica del comando
   *
   * @param {import('../../core/Client.cjs')} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   */
  async cmd (client, msg, match) {
    // desestructuración de los datos del mensaje
    const { _data: { notifyName: usuarioFrom }, from, id: { _serialized: quotedMessageId }, author } = msg
    // desestructuración de los datos de la expresión regular
    const [, action, registroTitle, paramId, paramTextTrim] = match

    async function sendMessage (message) {
      return await client.sendMessage(from, message, { quotedMessageId })
    }
    // Función para verificar si el usuario existe en la base de datos
    async function checkIfUserExistInDb ({ usuarioId }) {
      return await client.db.select().from('usuarios').where({ '=': { usuarioId } }).query()
    }
    // Función para guardar el usuario en la base de datos
    function saveGroupAndChat ({ userExistInDb, usuarioId }) {
      if (isArrayEmpty(userExistInDb)) {
        client.db.insert('usuarios').values({ usuarioId, usuarioFrom, createdAt: new Date().toLocaleString() }).query()
      }
    }
    let usuarioId

    // console.log({ msg })

    const chat = await msg.getChat()
    if (chat.isGroup) {
      usuarioId = author.split('@').shift()
      const userExistInDb = await checkIfUserExistInDb({ usuarioId })
      saveGroupAndChat({ userExistInDb, usuarioId })
    } else {
      usuarioId = from.split('@').shift()
      const userExistInDb = await checkIfUserExistInDb({ usuarioId })
      saveGroupAndChat({ userExistInDb, usuarioId })
    }

    const paramText = paramTextTrim
      ?.replace(/^\s*\n/gm, '')
      .split('\n')
      .map(ArrayTrim)
    const { create, view, save, random } = actions
    switch (action) {
      case create:
        (async () => {
          if (!registroTitle) return sendMessage('Debes ingresar un nombre para el registro')
          const check = await client.db.select().from('registros').where([{ '=': { registroTitle } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          if (!isArrayEmpty(check)) {
            return sendMessage(`El registro ${registroTitle} ya existe`)
          } else {
            await client.db.insert('registros').values({ usuarioId_Usuarios: usuarioId, registroTitle, createdAt: new Date().toLocaleString() }).query()
            return sendMessage(`El registro ${registroTitle} se ha creado exitosamente`)
          }
        })()
        break
      case view:
        (async () => {
          if (!registroTitle) {
            const registros = await client.db.select().from('registros').where({ '=': { usuarioId_Usuarios: usuarioId } }).query()
            if (isArrayEmpty(registros)) {
              return sendMessage('No tienes registros')
            }
            const registrosTitle = registros.map(({ registroId, registroTitle }) => `#${registroId} | ${registroTitle}`)
            return sendMessage(`Los registros de ${usuarioFrom} son:\n${registrosTitle.join('\n')}`)
          }
          const check = await client.db.select().from('registros').where([{ '=': { registroTitle } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          if (isArrayEmpty(check)) {
            return sendMessage(`El registro ${registroTitle} no existe`)
          }
          // mostrar las tareas del registro seleccionado
          const { registroId } = check.shift()
          const tareas = await client.db.select().from('tareas').where({ '=': { registroId_Registros: registroId } }).query()
          if (isArrayEmpty(tareas)) {
            return sendMessage(`El registro ${registroTitle} no tiene tareas`)
          }
          const tareasTitle = tareas.map(({ tareaId, tareaTitle }) => `#${tareaId} | ${tareaTitle}`)
          return sendMessage(`Las tareas del registro ${registroTitle} son:\n${tareasTitle.join('\n')}`)
        })()
        break
      case save:
        (async () => {
          if (!registroTitle) return sendMessage('Debes ingresar un nombre para el registro')
          const check = await client.db.select().from('registros').where([{ '=': { registroTitle } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          // indicar al usuario que no existe el resgistro donde quiere insertar tareas
          if (isArrayEmpty(check)) {
            return sendMessage(`El registro ${registroTitle} no existe`)
          }
          if (!paramText) {
            // indicar al usuario que no ha ingresado tareas
            return sendMessage('Debes ingresar tareas')
          }
          const { registroId } = check.shift()
          const tareas = paramText.map((tareaTitle) => ({ registroId_Registros: registroId, tareaTitle, createdAt: new Date().toLocaleString() }))
          await client.db.insert('tareas').values(tareas).query()
          return sendMessage(`Las tareas se han guardado exitosamente en el registro ${registroTitle}`)
        })()
        break
      case random:
        (async () => {
          if (!registroTitle) return sendMessage('Debes ingresar un nombre para el registro')
          const check = await client.db.select().from('registros').where([{ '=': { registroTitle } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          // indicar al usuario que no existe el resgistro de donde quiere obtener un tarea aleatoria
          if (isArrayEmpty(check)) {
            return sendMessage(`El registro ${registroTitle} no existe`)
          }
          const { registroId } = check.shift()
          const tareas = await client.db.select().from('tareas').where({ '=': { registroId_Registros: registroId } }).query()
          // indicar al usuario que no existen tareas en el registro
          if (isArrayEmpty(tareas)) {
            return sendMessage(`El registro ${registroTitle} no tiene tareas`)
          }
          tareas.sort(() => Math.random() - 0.5)
          const tarea = tareas[Math.floor(Math.random() * tareas.length)]
          return sendMessage(`La tarea aleatoria del registro ${registroTitle} es:\n#${tarea.tareaId} | ${tarea.tareaTitle}`)
        })()
        break
      default:

        sendMessage(
`Detalles del comando: _/tarea_
✅ *comando para crear un ruleta*
_/tarea_create=animes_

✅ *comando para guardar tareas dentro de un registro*
_/tarea_save=animes
anime1
anime2
anime3_

❌ *comando para borrar un tarea de un registro*
_/tarea_delete=animes=1_

✅ *comando para ver todos los registros del usuario*
_/tarea_view_

✅ *comando para ver todas las tareas de un registro*
_/tarea_view=animes_

❌ *comando para restaurar un registro de una tarea*
_/tarea_restore=animes=1_

❌ *comando para actualizar una tarea de un registro*
_/tarea_update=animes=1 anime1season2_

✅ *comando para obtener una tarea random de un registro*
_/tarea_random=animes_`
        )
        break
    }
  }
}
