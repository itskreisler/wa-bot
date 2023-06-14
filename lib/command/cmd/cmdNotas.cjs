const {
  configEnv: { BOT_USERNAME },
  MarkdownWsp: { monoespaciado },
  isArrayEmpty
} = require('../../helpers/Helpers.cjs')
const actions = Object.freeze({
  crear: 'create',
  guardar: 'save',
  eliminar: 'delete',
  ver: 'view',
  leer: 'read',
  actualizar: 'update',
  editar: 'edit',
  random: 'random',
  restaurar: 'restore'
})
module.exports = {
  active: true,
  /**
   * Definición de una expresión regular para el comando `/nota`. La expresión regular se usa para hacer coincidir la sintaxis del comando y extraer los parámetros pasados con el comando.
   */
  ExpReg: new RegExp(
    `^/nota(?:@${BOT_USERNAME})?(?:_(\\w+))?(?:=(\\w+))?(?:=([a-zA-Z_\\d]+))?(?:\\s+(.+))?$`,
    'mis'
  ),
  /**
   * Logica del comando
   *
   * @param {import('whatsapp-web.js').Client} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   */
  async cmd (client, msg, match) {
    // desestructuración de los datos del mensaje
    const { _data: { notifyName: usuarioFrom }, from, id: { _serialized: quotedMessageId }, author } = msg
    // desestructuración de los datos de la expresión regular
    const [, action, registroTitle, paramId, paramTextTrim] = match
    // Función para enviar un mensaje
    async function sendMessage (message) {
      return await client.sendMessage(from, message, { quotedMessageId })
    }
    // Función para verificar si el usuario existe en la base de datos
    async function checkIfUserExistInDb ({ usuarioId }) {
      return await client.db.select().from('usuarios').where({ '=': { usuarioId } }).query()
    }
    // Función para guardar el usuario en la base de datos
    async function saveGroupAndChat ({ userExistInDb, usuarioId }) {
      if (isArrayEmpty(userExistInDb)) {
        await client.db.insert('usuarios').values({ usuarioId, usuarioFrom, usuarioCreatedAt: new Date().toLocaleString() }).query()
      }
    }
    let usuarioId
    // obtenemos la informacion del chat
    const chat = await msg.getChat()
    // si el chat es un grupo
    if (chat.isGroup) {
      usuarioId = author.split('@').shift()
    } else {
      usuarioId = from.split('@').shift()
    }
    const userExistInDb = await checkIfUserExistInDb({ usuarioId })
    saveGroupAndChat({ userExistInDb, usuarioId })

    const paramText = paramTextTrim
      ?.replace(/^\s*\n/gm, '')
      .replace(/^\s*|\s*$|\s+(?=\s)/gm, '')
      .split('\n')
    // desestructurar las acciones
    const { crear, ver, guardar, random, actualizar, eliminar, editar } = actions
    // establecer las condiciones para cada accion
    switch (action) {
      case crear:
        (async () => {
          if (!registroTitle) return sendMessage('Debes ingresar un nombre para el registro')
          const check = await client.db.select().from('registros').where([{ '=': { registroTitle } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          if (!isArrayEmpty(check)) {
            return sendMessage(`El registro ${registroTitle} ya existe`)
          } else {
            await client.db.insert('registros').values({ usuarioId_Usuarios: usuarioId, registroTitle, registrocreatedAt: new Date().toLocaleString() }).query()
            return sendMessage(`El registro ${registroTitle} se ha creado exitosamente`)
          }
        })()
        break
      case ver:
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
      case guardar:
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
          const tareas = paramText.map((tareaTitle) => ({ registroId_Registros: registroId, tareaTitle, tareaCreatedAt: new Date().toLocaleString() }))
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
      case actualizar:
        (async () => {
          if (!registroTitle) return sendMessage('Debes ingresar un nombre para actualizar el registro')
          const check = await client.db.select().from('registros').where([{ '=': { registroTitle } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          // indicar al usuario que no existe el resgistro de donde quiere actualizar una tarea
          if (isArrayEmpty(check)) {
            return sendMessage(`El registro ${registroTitle} no existe`)
          }
          if (!paramId) {
            // indicar al usuario que no ha ingresado el id de la tarea
            return sendMessage('Debes ingresar el id de la tarea')
          }
          if (!paramText) {
            // indicar al usuario que no ha ingresado la tarea
            return sendMessage('Debes ingresar el nuevo nombre de la tarea')
          }
          const { registroId } = check.shift()
          const tareas = await client.db.select().from('tareas').where([{ '=': { registroId_Registros: registroId } }, { '=': { tareaId: paramId } }]).query()
          // indicar al usuario que no existe la tarea
          if (isArrayEmpty(tareas)) {
            return sendMessage(`La tarea ${paramId} no existe`)
          }
          // const tarea = tareas.shift()
          await client.db.update('tareas').set({ tareaTitle: paramText.join('\n') }).where([{ '=': { registroId_Registros: registroId } }, { '=': { tareaId: paramId } }]).query()
          return sendMessage(`La tarea ${paramId} se ha actualizado exitosamente`)
        })()
        break
      case eliminar:
        (async () => {
          if (!registroTitle) return sendMessage('Debes ingresar un nombre para eliminar el registro')
          const check = await client.db.select().from('registros').where([{ '=': { registroTitle } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          // indicar al usuario que no existe el resgistro de donde quiere eliminar una tarea
          if (isArrayEmpty(check)) {
            return sendMessage(`El registro ${registroTitle} no existe`)
          }
          if (!paramId) {
            // indicar al usuario que no ha ingresado el id de la tarea
            return sendMessage('Debes ingresar el id de la tarea')
          }
          const { registroId } = check.shift()
          const tareas = await client.db.select().from('tareas').where([{ '=': { registroId_Registros: registroId } }, { '=': { tareaId: paramId } }]).query()
          // indicar al usuario que no existe la tarea
          if (isArrayEmpty(tareas)) {
            return sendMessage(`La tarea #${paramId} no existe`)
          }
          const { tareaTitle } = tareas.shift()
          await client.db.delete().from('tareas').where([{ '=': { registroId_Registros: registroId } }, { '=': { tareaId: paramId } }]).query()
          return sendMessage(`La tarea #${paramId} | ${tareaTitle} se ha eliminado exitosamente`)
        })()
        break
      case editar:
        (async () => {
          if (!registroTitle) return sendMessage('Debes ingresar un nombre para editar el registro')
          const check = await client.db.select().from('registros').where([{ '=': { registroTitle } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          // indicar al usuario que no existe el resgistro
          if (isArrayEmpty(check)) {
            return sendMessage(`El registro ${registroTitle} no existe`)
          }
          if (!paramId) {
            // indicar al usuario que no ha ingresado el nuevo nombre del registro
            return sendMessage('Debes ingresar el nuevo nombre del registro')
          }
          const { registroId } = check.shift()
          await client.db.update('registros').set({ registroTitle: paramId }).where([{ '=': { registroId } }, { '=': { usuarioId_Usuarios: usuarioId } }]).query()
          return sendMessage(`El registro ${monoespaciado(registroTitle)} se ha actualizado exitosamente`)
        })()
        break
      default:

        sendMessage(
`Detalles del comando: _/nota_
✅ *comando para crear una nota*
_/nota_create=animes_

✅ *comando para editar el nombre de una nota*
_/nota_edit=animes=nuevo_nombre_animes_

✅ *comando para guardar tareas en una nota*
_/nota_save=animes_
_mi anime1_
_mi anime2_
_mi anime3_

✅ *comando para borrar un tarea de una nota*
_/nota_delete=animes=1_

✅ *comando para ver todas las notas del usuario*
_/nota_view_

✅ *comando para ver todas las tareas de una nota*
_/nota_view=animes_

❌ *comando para restaurar un tarea de una nota*
_/nota_restore=animes=1_

✅ *comando para actualizar una tarea de una nota*
_/nota_update=animes=1 anime1season2_

✅ *comando para obtener una tarea random de una nota*
_/nota_random=animes_`
        )
        break
    }
  }
}
