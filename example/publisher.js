'use strict'

var bodyParser = require('body-parser')
var express = require('express')
var ngrok = require('ngrok')
var series = require('run-series')

const PubSub = require('../')

let addr
let node
let ps

function bootNode (next) {
  const port = 4000
  node = express()
  node.use(bodyParser.json())
  node.use(bodyParser.urlencoded({ extended: true }))
  node.listen(port, function() {})

  ngrok.connect(port, function (err, address) {
    if (err) {
      throw err
    }
    console.log('Publisher listening on: ' + address)
    addr = address

    next(err)
  })
}

function setUpPS (next) {
  console.log('attaching pubsub')
  ps = new PubSub(node, addr)
  next()
}

function publishMsg (err) {
  if (err) {
    throw err
  }
  
  setInterval(() => {
    process.stdout.write('.')
    ps.publish('interop', 'hey, how is it going?')
  }, 300)
}

series([
  bootNode,
  setUpPS
], publishMsg)

