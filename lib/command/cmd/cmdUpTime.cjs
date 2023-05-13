const { configEnv } = require('../../helpers/Helpers.cjs')
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/uptime(?:@${configEnv.BOT_USERNAME})?$`, 'im'),
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
    // estoy activo desde hace 0meses, 0dias, 0horas, 0minutos, 0segundos
    const uptimeText = `${Math.floor(uptime / 2592000)}meses, ${Math.floor(
      uptime / 86400
    )}dias, ${Math.floor(uptime / 3600)}horas, ${Math.floor(
      uptime / 60
    )}minutos, ${Math.floor(uptime % 60)}segundos`
    client.sendMessage(
      from,
      `
    *🤖 Bot Uptime*
    \n*Hora desde mi inicio:*\n${fechaFormateada}
    \n*Estoy activo desde hace:*\n${uptimeText}`
    )
  }
}
