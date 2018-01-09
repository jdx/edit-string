import * as tmp from 'tmp'

const launch = require('launch-editor')

function tmpFile (opts: tmp.Options): Promise<{name: string, fd: number, cleanup: () => void}> {
  return new Promise((resolve, reject) => {
    tmp.file(opts, (err, name, fd, cleanup) => {
      if (err) return reject(err)
      resolve({name, fd, cleanup})
    })
  })
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

  launch(name)
  let output = await fs.readFile(name, 'utf8')
  cleanup()
  return output
}
