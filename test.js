const edit = require('./')

edit(`{"foo": "bar"}`, {postfix: '.json'}).then(result => {
  console.log(`Received:`)
  console.dir(result)
})
