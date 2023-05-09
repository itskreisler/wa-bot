const { configEnv } = require('../../helpers/Helpers.cjs')
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/uptime(?:@${configEnv.USERNAME_BOT})?$`, 'im'),
  async cmd (client, msg) {
    const fechaActual = new Date(client.upTime)
    const dia = fechaActual.getDate().toString().padStart(2, '0')
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0')
    const ano = fechaActual.getFullYear().toString().slice(-2)
    const hora = fechaActual.getHours().toString().padStart(2, '0')
    const minutos = fechaActual.getMinutes().toString().padStart(2, '0')
    const segundos = fechaActual.getSeconds().toString().padStart(2, '0')

    const fechaFormateada = `${dia}/${mes}/${ano} ${hora}:${minutos}:${segundos}`

    const { from } = msg
    const uptime = process.uptime()
    const uptimeText = `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`
    client.sendMessage(from, `
    *🤖 Bot Uptime*
    \n*Hora desde mi inicio* : ${fechaFormateada}
    \n*Estoy activo desde hace ${uptimeText}*`)
  }
}
