function spawn (...args) {
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    spawn(...args)
    .on('error', reject)
    .on('close', resolve)
  })
}

function tmpFile (opts) {
  return new Promise((resolve, reject) => {
    const tmpFile = require('tmp').file
    tmpFile(opts, (err, name, fd, cleanup) => {
      if (err) return reject(err)
      resolve({name, fd, cleanup})
    })
  })
}

let _debug
function debug (...args) {
  if (!_debug) _debug = require('debug')('edit-string')
  return _debug(...args)
}

async function edit (name, editor) {
  debug(editor, [name])
  let msg = `Waiting for ${editor}... `
  process.stderr.write(msg)
  await spawn(editor, [name], {shell: true, stdio: 'inherit'})
  process.stderr.write(`\r${msg.replace(/./g, ' ')}\r`)
}

module.exports = async function (input, options = {}) {
  const {promisify} = require('util')
  const FS = require('fs')
  const fs = {
    write: promisify(FS.write),
    readFile: promisify(FS.readFile)
  }

  const {name, fd, cleanup} = await tmpFile(options)
  await fs.write(fd, input)

  const editors = [process.env.VISUAL || process.env.EDITOR, 'pico', 'nano', 'vi']
  for (let editor of editors) {
    try {
      await edit(name, editor)
      let output = await fs.readFile(name, 'utf8')
      cleanup()
      return output
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(err)
        continue
      }
      throw err
    }
  }
  throw new Error('No $VISUAL or $EDITOR set')
}
