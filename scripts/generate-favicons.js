/**
 * Generates favicon files from public/logo.png:
 *   favicon.ico (16+32)
 *   favicon-16x16.png
 *   favicon-32x32.png
 *   apple-touch-icon.png (180x180)
 * Run: node scripts/generate-favicons.js
 * Requires: npm install sharp to-ico --save-dev
 */

const fs = require('fs')
const path = require('path')

const PUBLIC = path.join(__dirname, '..', 'public')
const LOGO = path.join(PUBLIC, 'logo.png')

async function main() {
  let sharp, toIco
  try {
    sharp = require('sharp')
    toIco = require('to-ico')
  } catch (e) {
    console.error('Missing deps. Run: npm install sharp to-ico --save-dev')
    process.exit(1)
  }

  if (!fs.existsSync(LOGO)) {
    console.error('Source not found: public/logo.png')
    process.exit(1)
  }

  const opts = { fit: 'cover', position: 'center' }

  const png16 = await sharp(LOGO).resize(16, 16, opts).png().toBuffer()
  const png32 = await sharp(LOGO).resize(32, 32, opts).png().toBuffer()
  const png180 = await sharp(LOGO).resize(180, 180, opts).png().toBuffer()

  fs.writeFileSync(path.join(PUBLIC, 'favicon-16x16.png'), png16)
  fs.writeFileSync(path.join(PUBLIC, 'favicon-32x32.png'), png32)
  fs.writeFileSync(path.join(PUBLIC, 'apple-touch-icon.png'), png180)

  const ico = await toIco([png16, png32])
  fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), ico)

  console.log('Favicons generated: favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
