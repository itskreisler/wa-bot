const qrcode = require('qrcode-terminal')
module.exports = async (client, qr) => {
  // Generate and scan this code with your phone
  // console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: true })
}
