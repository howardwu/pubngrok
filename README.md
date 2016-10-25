# pubngrok
[![Version](http://img.shields.io/npm/v/pubngrok.svg)](https://www.npmjs.org/package/pubngrok)

Publish/Subscribe (PubSub) built with ngrok for simple, lightweight client communication

## Installation

Install via commmand line with:
```
  npm install pubngrok
```

Install the library dependencies with:
```
  npm install
```

## Example

A publisher and subscriber implementation is provided in the `example` folder. After starting the publisher by running `node publisher.js`, copy/paste the publisher's address into `subscriber.js` and run `node subscriber.js`. For debugging logs, run `export DEBUG=ON` in the terminal.
