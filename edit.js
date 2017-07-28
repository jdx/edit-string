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

  let f = await tmpName(options)
  await writeFile(f, input)

  const editors = [process.env.VISUAL || process.env.EDITOR, 'pico', 'nano', 'vi']
  for (let editor of editors) {
    try {
      await spawn(editor, [f], {stdio: 'inherit'})
      return readFile(f, 'utf8')
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }
  throw new Error('No $VISUAL or $EDITOR set')
}
