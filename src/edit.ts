import * as tmp from 'tmp'
import * as execa from 'execa'
import _ from 'ts-lodash'

const debug = require('debug')('edit-string')

function tmpFile (opts: tmp.Options): Promise<{name: string, fd: number, cleanup: () => void}> {
  return new Promise((resolve, reject) => {
    tmp.file(opts, (err, name, fd, cleanup) => {
      if (err) return reject(err)
      resolve({name, fd, cleanup})
    })
  })
}


async function edit (name: string, editor: string) {
  debug(editor, [name])
  let msg = `Waiting for ${editor}... `
  process.stderr.write(msg)
  await execa(editor, [name], {stdio: 'inherit'})
  process.stderr.write(`\r${msg.replace(/./g, ' ')}\r`)
}

module.exports = async function (input: string, options = {}): Promise<string> {
  const {promisify} = require('util')
  const FS = require('fs')
  const fs = {
    write: promisify(FS.write),
    readFile: promisify(FS.readFile)
  }

  const {name, fd, cleanup} = await tmpFile(options)
  await fs.write(fd, input)

  const editors = _.compact([process.env.VISUAL || process.env.EDITOR, 'pico', 'nano', 'vi'])
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
