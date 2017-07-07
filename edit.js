function spawn (...args) {
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    spawn(...args)
    .on('error', reject)
    .on('close', resolve)
  })
}

module.exports = async function (input) {
  const {promisify} = require('util')
  const tmp = require('tmp')
  const fs = require('fs')
  const tmpName = promisify(tmp.tmpName)
  const writeFile = promisify(fs.writeFile)
  const readFile = promisify(fs.readFile)

  let f = await tmpName()
  await writeFile(f, input)

  const {EDITOR} = process.env
  if (!EDITOR) throw new Error('No $EDITOR set')
  await spawn(EDITOR, [f], {stdio: 'inherit'})
  return readFile(f, 'utf8')
}
