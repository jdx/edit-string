const edit = require('./')

edit('foo').then(result => {
  console.log(`Received: ${result}`)
})
