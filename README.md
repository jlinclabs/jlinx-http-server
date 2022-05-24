# jlinx-http-server

This http server provides a REST HTTP API for reading and writing
[Decentralized IDs (DIDs)](https://w3c.github.io/did-core/) 
persisted and shared using the 
[Hypercore protocol](https://hypercore-protocol.org)


## Development

```bash
DEBUG=jlinx* PORT=3001 JLINX_STORAGE=~/tmp/jlinx-3001 npm start
```

```bash
nodemon -w ../ --exec
```

## Setup

```bash
$ npm install -g jlinx-server
$ PORT=8080 jlinx-server start
```

or

```js
import jlinxHttpServer from 'jlinx-http-server'
const server = jlinxHttpServer({
  storagePath: './path/to/store/hypercores',
  port: 8080,
})
server.start()
```

