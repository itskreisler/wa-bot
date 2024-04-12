const { configEnv: { BOT_USERNAME, NODE_ENV }, MarkdownWsp } = require('../../helpers/Helpers.cjs')
const { latestEpisodesAdded } = require('animeflv')
const { execPromise } = require('../../helpers/exec.promise.cjs')
const fs = require('fs')
const { MessageMedia } = require('whatsapp-web.js')
const ifUbuntu = NODE_ENV === 'production' ? '3' : ''
const mock = [{
  "id": "tensei-shitara-slime-datta-ken-3rd-season-2",
  "title": "Tensei shitara Slime Datta Ken 3rd Season",
  "poster": "https://animeflv.net/uploads/animes/thumbs/3966.jpg",
  "episode": 2,
  "servers": [
    {
      "server": "mega",
      "title": "MEGA",
      "ads": 0,
      "url": "https://mega.nz/#!ZWcTDbiD!a-QJgFwgmmqVD4eBCh0HbDvWCkLGpHqMuDel17gghfA",
      "allow_mobile": true,
      "code": "https://mega.nz/embed#!ZWcTDbiD!a-QJgFwgmmqVD4eBCh0HbDvWCkLGpHqMuDel17gghfA"
    },
    {
      "server": "sw",
      "title": "SW",
      "ads": 0,
      "allow_mobile": true,
      "code": "https://streamwish.to/e/8081j0fr10kx"
    },
    {
      "server": "yu",
      "title": "YourUpload",
      "ads": 0,
      "allow_mobile": true,
      "code": "https://www.yourupload.com/embed/0g8680aaX2As"
    },
    {
      "server": "maru",
      "title": "Maru",
      "ads": 0,
      "allow_mobile": true,
      "code": "https://my.mail.ru/video/embed/7512958666216053237#aylaz9ymde#6645"
    },
    {
      "server": "okru",
      "title": "Okru",
      "ads": 0,
      "allow_mobile": true,
      "code": "https://ok.ru/videoembed/7680484575921"
    },
    {
      "server": "netu",
      "title": "Netu",
      "ads": 1,
      "allow_mobile": true,
      "code": "https://hqq.tv/player/embed_player.php?vid=WDZ5WGxPUElvbU1DRW9aSFo5M0xHUT09"
    },
    {
      "server": "stape",
      "title": "Stape",
      "ads": 1,
      "url": "https://streamtape.com/v/J0W27V6Mrecj1RP/",
      "allow_mobile": true,
      "code": "https://streamtape.com/e/J0W27V6Mrecj1RP/"
    }
  ]
}]
module.exports = {
  active: true,
  ExpReg: new RegExp(`^/flv(?:_(\\w+))?(?:@${BOT_USERNAME})?$`, 'im'),
  /**
   * Logica del comando
   *
   * @param {import('../../core/Client.cjs')} client - Cliente de whatsapp-web.js
   * @param {import('whatsapp-web.js').Message} msg - Mensaje de whatsapp-web.js
   * @param {RegExpMatchArray} match - Resultado de la expresion regular
   */
  async cmd(client, msg, match) {
    const CRON_JOB = `0 0 6-23 * * * *`
    const DBFLV = client.db
    const [_x, accion] = match
    const { from } = msg
    // obtener el chat
    const chat = await msg.getChat()
    const { id: { _serialized }, isGroup } = chat
    if (!isGroup) {
      return await msg.reply('Este comando solo puede ser usado en grupos')
    }
    switch (accion) {
      case 'on':
        // validar si en DBFLV hay un registro del nuevo episodio
        client.createTask(_serialized, CRON_JOB, async () => {
          const episodes = await latestEpisodesAdded()
          // const episodes = mock
          let contadorNewEpisodes = 0
          episodes.forEach(async (capitulo) => {
            const { id, episode, title, poster, servers } = capitulo
            console.log(`validando si ${id} existe en DBFLV...`)
            if (!(id in DBFLV)) {
              contadorNewEpisodes++
              DBFLV[id] = capitulo
              // valida si estae le servidor OKRU
              const server = servers.find(({ server }) => server === 'okru')
              if (server) {
                const { code } = server
                console.log(`Creando miniatura de ${title} #${episode}...`)
                const thumbnail = await MessageMedia.fromUrl(poster)
                const caption = `El episodio ${MarkdownWsp.blockQuote(`#${episode}`)} de ${MarkdownWsp.negrita(title)} ya está disponible`
                console.log(`Enviando poster de ${title} #${episode}...`)
                await client.sendMessage(_serialized, thumbnail, { caption })
                try {
                  const script = `python${ifUbuntu} -u ${code} -f "${id}"`
                  console.log(`Descargando y reduciendo tamaño de ${title} #${episode}...`)
                  await execPromise(script)
                  console.log(`Archivo descargado y reducido, ${title} #${episode}...`)
                  const rutaArchivo = `./OK-RU/${id}_min.mp4`
                  console.log(`Enviando ${title} #${episode} a ${_serialized}...`)
                  // const mediaFileOutput = MessageMedia.fromFilePath(rutaArchivo)
                  // await client.sendMessage(_serialized, mediaFileOutput,{sendMediaAsDocument: true})
                  client.sendMessage(_serialized, mediaFileOutput).then(() => {
                    fs.unlinkSync(rutaArchivo)
                    console.log(`Archivo ${rutaArchivo} eliminado.`)
                  })
                  console.log(`${title} #${episode} descargado, minimizado y enviado.`)
                } catch (e) {
                  console.log('Ha ocurrido un error al descargar el episodio', e)
                }
              } else {
                //await client.sendMessage(_serialized, )
              }
            }
          })
          if (contadorNewEpisodes === 0) {
            return await msg.reply('No hay nuevos episodios')
          }
        })
        break
      case 'off':
        (async () => {
          const [fueDestruida] = client.destroyTask(_serialized)
          if (fueDestruida) {
            await msg.reply('Notificaciones desactivadas')
          } else {
            await msg.reply('No hay notificaciones activas')
          }
        })()
        break
      default:
        (async () => await msg.reply('Debes especificar si deseas activar o desactivar las notificaciones de nuevos episodios'))()
        break
    }
  }
}
