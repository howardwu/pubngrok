# pubgrok
[![Version](http://img.shields.io/npm/v/pubgrok.svg)](https://www.npmjs.org/package/pubgrok)

PubSub built using ngrok providing a simple, lightweight API

## Installation

Install via commmand line with:
```
  npm install pubgrok
```

Install the library dependencies with:
```
  npm install
```

## Example

A publisher and subscriber implementation is provided in the `example` folder. After starting the publisher by running `node publisher.js`, copy/paste the publisher's address into `subscriber.js` and run `node subscriber.js`. For debugging logs, run `export DEBUG=ON` in the terminal.
