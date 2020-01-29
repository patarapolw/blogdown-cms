const fs = require('fs')

if (!fs.existsSync('config.json')) {
  const readlineSync = require('readline-sync')
  const dotenv = require('dotenv')
  dotenv.config()

  const config = require('./config.default.json')
  const envStream = fs.createWriteStream('.env', { flags: fs.existsSync('.env') ? 'a' : undefined })

  if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = readlineSync.question('MONGO_URI is required. Please input MONGO_URI. ')
    envStream.write('\n' + `MONGO_URI=${process.env.MONGO_URI}`)
  }

  let {
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_URL,
  } = process.env

  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME) {
    if (!CLOUDINARY_URL) {
      CLOUDINARY_URL = readlineSync
        .question('Do you want to use Cloudinary? Please input CLOUDARY_URL. ')
    }

    const [_, apiKey, apiSecret, cloudName] = /\/\/([^:]+):([^@]+)@([^/]+)/.exec(CLOUDINARY_URL) || []
    Object.assign(config.cloudinary, { apiKey, apiSecret, cloudName })
  } else {
    Object.assign(config.cloudinary, {
      apiKey: CLOUDINARY_API_KEY,
      apiSecret: CLOUDINARY_API_SECRET,
      cloudName: CLOUDINARY_CLOUD_NAME,
    })
  }

  if (!process.env.GH_PAGES) {
    process.env.GH_PAGES = readlineSync.question([
      'Do you want to store media in GitHub Pages [Y/n]',
      'Please input URL (*.git), if you want to store in a custom Git. ',
    ].join('\n'), {
      defaultInput: 'Y',
    })
  }

  let ghPages = process.env.GH_PAGES

  if (['n', '0'].includes(ghPages.toLocaleLowerCase())) {
    ghPages = false
  } else if (['y', '1'].includes(ghPages.toLocaleLowerCase())) {
    ghPages = true
  }

  config.ghPages = ghPages

  const nowSh = process.env.NOW_DEPLOYMENT_NAME ||
    readlineSync.question('Please input now.sh deployment name, if you want to upload your API to now.sh. ')

  if (nowSh) {
    fs.writeFileSync('packages/admin/now.json', JSON.stringify({
      name: nowSh,
      version: 2,
      env: {
        NOW: '1',
        MONGO_URI: process.env.MONGO_URI,
      },
    }, null, 2))
  }

  fs.writeFileSync('config.json', JSON.stringify(config, null, 2))
  envStream.end()
}
