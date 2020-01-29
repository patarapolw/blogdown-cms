const fs = require('fs')
const { spawn } = require('child_process')

const ghPages = require('gh-pages')

const config = require('./config.json');

(async () => {
  if (process.env.NOW !== '0' && fs.existsSync('packages/admin/now.json')) {
    await new Promise((resolve, reject) => {
      const nowDeploy = spawn('yarn', ['deploy'], {
        cwd: './packages/admin',
      }, {
        stdio: 'inherit',
      })

      nowDeploy.on('error', (err) => {
        console.error('Not published to now.sh')
        reject(err)
      })
      nowDeploy.on('close', () => {
        console.log('Published to now.sh')
        resolve()
      })
    })
  }

  if (process.env.GH_PAGES !== '0' && config.ghPages) {
    await new Promise((resolve, reject) => {
      ghPages.publish('./user', (() => {
        if (config.ghPages === true) {
          return {}
        } else if (typeof config.ghPages === 'string') {
          return {
            git: config.ghPages,
          }
        } else {
          return config.ghPages
        }
      })(), (err) => {
        if (err) {
          console.error('Not published to GitHub Pages')
          reject(err)
        } else {
          console.log('Published to GitHub Pages')
          resolve()
        }
      })
    })
  }
})().catch(console.error)
