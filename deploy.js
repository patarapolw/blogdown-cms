const fs = require('fs')
const path = require('path')

const execa = require('execa')

/**
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} [opts]
 * @param {string} opts.cwd
 */
async function execaPipe (cmd, args, opts) {
  const p = execa(cmd, args, opts)
  p.stdout.pipe(process.stdout)
  return p
}

async function main () {
  const r = await execaPipe('git', ['branch'])
  if (!(r.all && r.all.includes('heroku-dist'))) {
    await execaPipe('git', ['branch', '-b', 'heroku-dist'])
    await execaPipe('git', ['worktree', 'add', 'heroku-dist'])
    await execaPipe('git', ['rm', '-rf'], {
      cwd: 'heroku-dist'
    })

    const { dependencies, engines } = require('./packages/server/package.json')
    fs.writeFileSync(path.join('heroku-dist', 'package.json'), JSON.stringify({ dependencies, engines }, null, 2))
    fs.writeFileSync(path.join('heroku-dist', 'Procfile'), 'web: node server.js')

    await execaPipe('npm', ['install'], {
      cwd: 'heroku-dist'
    })
  }

  await execaPipe('npm', ['run', 'build'], {
    cwd: 'packages/server'
  })
}

main()
