function spawn (...args) {
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    spawn(...args)
    .on('error', reject)
    .on('close', resolve)
  })
}

module.exports = async function (input, options = {}) {
  const {promisify} = require('util')
  const tmp = require('tmp')
  const fs = require('fs')
  const tmpName = promisify(tmp.tmpName)
  const writeFile = promisify(fs.writeFile)
  const readFile = promisify(fs.readFile)
  const unlink = promisify(fs.unlink)
  const debug = require('debug')

  let f = await tmpName(options)
  await writeFile(f, input)

  const editors = [process.env.VISUAL || process.env.EDITOR, 'pico', 'nano', 'vi']
  for (let editor of editors) {
    try {
      debug(editor, [f])
      let msg = `Waiting for ${editor}... `
      process.stderr.write(msg)
      await spawn(editor, [f], {shell: true, stdio: 'inherit'})
      process.stderr.write(`\r${msg.replace(/./g, ' ')}\r`)
      let output = await readFile(f, 'utf8')
      unlink(f).catch(err => console.error(err))
      return output
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }
  throw new Error('No $VISUAL or $EDITOR set')
}
