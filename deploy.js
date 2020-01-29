const { spawn } = require('child_process')

const ghPages = require('gh-pages');

(async () => {
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

  await new Promise((resolve, reject) => {
    ghPages.publish('./user', (err) => {
      if (err) {
        console.error('Not published to GitHub Pages')
        reject(err)
      } else {
        console.log('Published to GitHub Pages')
        resolve()
      }
    })
  })
})().catch(console.error)
