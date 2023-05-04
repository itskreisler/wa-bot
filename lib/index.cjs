require('dotenv').config()
require('colors')
const fs = require('fs')
if (!fs.existsSync('./tmp/')) {
  fs.mkdirSync('./tmp/')
}

const Client = require('./core/Client.cjs')

const bot = new Client()
bot.initialize()
