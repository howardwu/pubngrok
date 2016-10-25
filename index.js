'use strict'

const _intersection = require('lodash.intersection')
const _uniq = require('lodash.uniq')
const EE = require('events').EventEmitter
const request = require('request')

module.exports = PubSub

PubSub.prototype.__proto__ = EE.prototype;

function logger (msg) {
  if (process.env.DEBUG) {
    console.log('debug:', msg)
  }
}

function PubSub (node, address) {
  if (!(this instanceof PubSub)) {
    return new PubSub(node, address)
  }

  EE.call(this)

  const that = this

  // peer structure { address: "<addr>", topics: [<topic1>, <topic2>] }
  const peers = []
  const subscriptions = []

  this.publish = (topic, message) => {
    logger('publish')

    if (typeof topic === 'string' && typeof message === 'string') {
      // send to all the other interested peers
      peers.forEach((peer) => {
        if (_intersection(peer.topics, [topic]).length > 0) {
          const msg = {
            topic: topic,
            message: message,
            from: address
          }

          request({
            url: peer.address + '/pubgrok/publish',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg)
          }, function (error, response, body) {
            if (response.statusCode === 200) {
              logger('published to ' + peer.address)
            }
          })
        }
      })
    } 
  }

  this.subscribe = (topics) => {
    logger('subscribe')

    if (!Array.isArray(topics)) {
      topics = [topics]
    }

    topics.forEach((topic) => {
      if (subscriptions.indexOf(topic) === -1) {
        subscriptions.push(topic)
      }
    })

    peers.forEach((peer) => {
      const msg = {
        from: address,
        topics: topics
      }

      request({
        url: peer.address + '/pubgrok/subscribe',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      }, function (error, response, body) {
        if (response.statusCode === 200) {
          logger('subscribe sent to ' + peer.address)
        }
      })
    })
  }

  this.unsubscribe = (topics) => {
    logger('unsubscribe')

    if (!Array.isArray(topics)) {
      topics = [topics]
    }

    topics.forEach((topic) => {
      const index = subscriptions.indexOf(topic)
      if (index > -1) {
        subscriptions.splice(index, 1)
      }
    })

    peers.forEach((peer) => {
      const msg = {
        from: address,
        topics: topics
      }

      request({
        url: peer.address + '/pubgrok/unsubscribe',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      }, function (error, response, body) {
        if (response.statusCode === 200) {
          logger('unsubscribe sent to ' + peer.address)
        }
      })
    })
  }

  this.connect = (newPeerInfo) => {
    logger('connect')

    var exists = false

    if (peers.length === 0) {
      const msg = {
        peerInfo: {
          address: address,
          topics: subscriptions
        }
      }

      request({
        url: newPeerInfo.address + '/pubgrok/connect',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      }, function (error, response, body) {
        if (response.statusCode === 200) {
          logger("connected to " + newPeerInfo.address)
          peers.push(newPeerInfo)
        }
      })
    }
    else {
      for (var i = 0; i < peers.length; i++) {
        const peer = peers[i]

        if (peer.address === newPeerInfo.address) {
          exists = true
        }

        if (i === peers.length - 1 && !exists) {
          const msg = {
            peerInfo: newPeerInfo
          }

          request({
            url: newPeerInfo.address + '/pubgrok/connect',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg)
          }, function (error, response, body) {
            if (response.statusCode === 200) {
              console.log("Connected to " + newPeerInfo.address)
              peers.push(newPeerInfo)
            }
          })
        }
      } 
    }
  }

  this.getPeers = () => {
    return peers
  }

  this.getSubscriptions = () => {
    return subscriptions
  }

  node.post('/pubgrok/publish', function (req, res, next) {
    logger('/pubgrok/publish')

    if (req.body !== undefined || req.body !== null) {
      const topic = req.body.topic
      const message = req.body.message
      const peerAddress = req.body.from

      that.emit(topic, message)

      res.sendStatus(200)
    }
  })

  node.post('/pubgrok/subscribe', function (req, res, next) {
    logger('/pubgrok/subscribe')

    if (req.body !== undefined || req.body !== null) {
      const peerTopics = req.body.topics
      const peerAddress = req.body.from
      
      peers.forEach((peer) => {
        if (peer.address === peerAddress) {
          peer.topics = _uniq(peer.topics.concat(peerTopics))

          res.sendStatus(200)
        }
      })
    }
  })

  node.post('/pubgrok/unsubscribe', function (req, res, next) {
    logger('/pubgrok/unsubscribe')

    if (req.body !== undefined || req.body !== null) {
      const peerTopics = req.body.topics
      const peerAddress = req.body.from
      
      peers.forEach((peer) => {
        if (peer.address === peerAddress) {
          peerTopics.forEach((topic) => {
            const index = peer.topics.indexOf(topic)
            if (index > -1) {
              peer.topics.splice(index, 1)
            }
          })

          res.sendStatus(200)
        }
      })
    }
  })

  node.post('/pubgrok/connect', function (req, res, next) {
    logger('/pubgrok/connect')

    if (req.body !== undefined || req.body !== null) {
      const newPeerInfo = req.body.peerInfo
      var exists = false

      if (peers.length === 0) {
        peers.push(newPeerInfo)
        res.sendStatus(200)
      }
      else {
        for (var i = 0; i < peers.length; i++) {
          const peer = peers[i]

          if (peer.address === newPeerInfo.address) {
            exists = true
          }

          if (i === peers.length - 1 && !exists) {
            peers.push(newPeerInfo)
            res.sendStatus(200)
          }
        }
      }
    }
  })

}
