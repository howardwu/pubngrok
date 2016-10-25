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
  const port = 4002
  node = express()
  node.use(bodyParser.json())
  node.use(bodyParser.urlencoded({ extended: true }))
  node.listen(port, function() {})

  ngrok.connect(port, function (err, address) {
    if (err) {
      throw err
    }
    console.log('Listener listening on: ' + address)
    addr = address

    next(err)
  })
}

function setUpPS (next) {
  console.log('attaching pubsub')
  ps = new PubSub(node, addr)

  const peerInfo = {
    address: 'https://6c6241e1.ngrok.io', // paste publisher address
    topics: []
  }

  ps.connect(peerInfo)

  next()
}

function listen (err) {
  if (err) {
    throw err
  }

  ps.on('interop', (message) => {
    console.log(message)
  })

  setTimeout(() => {
    ps.subscribe('interop')
  }, 3000)
}

series([
  bootNode,
  setUpPS
], listen)

