# Prysmo

A service gateway framework providing lightweight bidirectional communication between your web clients and application services. Prysmo implemements a custom WebSocket protocol in one end and provides a fimiliar NodeJS API in the other.

## Get Started
- Install prysmo as a dependency in your gateway project: `npm i prysmo`
- In your code:

```js
// Import the module
const Prysmo = require('prysmo');

// Instance a new server
let server = new Prysmo();

// Register an endpoint
server.endpoint('hello', (sess, data, send) => send('Hello World!') );

// Start listening to default port
server.listen();
```

- Connect to the websocket at `ws://localhost:7667`
- Send the following message `{"endpoint":"hello"}`
- You will receive a message containing: `{"endpoint":"hello","data":"Hello World!"}`

## Features
- **WebSockets:** communicates with web clients through perforance oriented technology.
- **Encryption:** allows secure connections over TLS.
- **Session:** stores your users' credentials allowing seamless interaction with stateless services.
- **NodeJS:** gets out of your way delivering familiar development experience.
- **Logging:** emits a simple `log` event exposing all relevant information.
- **Settings:** all features farly configurable to fit in your use case.

## Client Implementations
- [Node Prysmo](https://gitlab.com/prysmo/node-prysmo)
- [JS Prysmo](https://gitlab.com/prysmo/js-prysmo)

## Archietcture

This is where prysmo will sit in your stack.

![Prymo Placement](https://i.imgur.com/mnjAYWM.png)

## Documentation
- [Quick Start]()
- [API Reference]()
- [Settings Reference]()
- [Usage Examples]()
- [Prism Protocol Spec]()

## Community
Meet us at:

- [Twitter](https://twitter.com/_prysmo)
- [Gitter](https://gitter.im/prysmo/community)
