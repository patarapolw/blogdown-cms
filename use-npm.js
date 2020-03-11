if (process.env.npm_execpath.includes('yarn')) {
  throw new Error('You must use NPM to install, not Yarn')
}