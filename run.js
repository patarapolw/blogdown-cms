const fs = require('fs')
const path = require('path')

const argv = require('minimist')(process.argv.slice(2))
const execa = require('execa')
const open = require('open')
const yaml = require('js-yaml')
const dotenv = require('dotenv')
const isPortAvailable = require('is-port-reachable')

dotenv.config()

const config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'))

process.env.PORT = process.env.PORT || '24000'

async function sleep (msec) {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

/**
 *
 * @param {object} opts
 * @param {string} opts.cwd
 * @param {string[]} opts.cmd
 */
async function npmRunAutoInstall (opts) {
  if (!fs.existsSync(path.join(opts.cwd, 'node_modules'))) {
    await execa('npm', ['install'], {
      cwd: path.resolve(opts.cwd)
    })
  }

  const p = execa('npm', ['run', ...opts.cmd], {
    cwd: path.resolve(opts.cwd)
  })
  p.stdout.pipe(process.stdout)
  // p.stderr.pipe(process.stderr)

  return p
}

async function main () {
  if (argv.mode === 'dev') {
    npmRunAutoInstall({ cwd: 'packages/admin-web', cmd: ['dev'] })
    npmRunAutoInstall({ cwd: 'packages/server', cmd: ['dev'] })

    while (!await isPortAvailable(config.devServer.port)) {
      await sleep(1000)
    }

    open(`http://localhost:${config.devServer.port}`)
  } else if (['admin', 'local'].includes(argv.mode)) {
    await Promise.all([
      (async () => {
        if (!fs.existsSync(path.resolve('packages/admin-web/dist'))) {
          await npmRunAutoInstall({ cwd: 'packages/admin-web', cmd: ['build'] })
        }
      })(),
      (async () => {
        if (!fs.existsSync(path.resolve('packages/server/dist'))) {
          await npmRunAutoInstall({ cwd: 'packages/server', cmd: ['build'] })
        }
      })()
    ])

    if (argv.mode === 'local' || !process.env.MONGO_URI) {
      execa('docker run mongo -v mongo-data:/data/db/ -p 27072:27072')
      while (!await isPortAvailable(27072)) {
        await sleep(1000)
      }
      process.env.MONGO_URI = 'http://localhost:27072/test'
      delete process.env.CLOUDINARY_API_KEY
      delete process.env.CLOUDINARY_API_SECRET
      delete process.env.CLOUDINARY_CLOUD_NAME
    }

    npmRunAutoInstall({ cwd: 'packages/server', cmd: ['admin'] })

    while (!await isPortAvailable(process.env.PORT)) {
      await sleep(1000)
    }

    open(`http://localhost:${process.env.PORT}`)
  }
}

main()
