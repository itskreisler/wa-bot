const { glob } = require('glob')
module.exports = class BotUtils {
  constructor (client) {
    this.client = client
  }

  async loadFiles (dirName) {
    // usalo si usas la version glob@10.2.2
    const Files = await glob(`${process.cwd().replace(/\\/g, '/')}/${dirName}/**/*.{cjs,js,json}`)
    Files.forEach((file) => delete require.cache[require.resolve(file)])
    return Files
  }
}
