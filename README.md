# Traffic Gen

Traffic Gen is an application that was made to simulate and test traffic scenarios.

Each module can expose an HTTP API and/or a socket (for real-time, two-way communications). Currently, it only supports Diameter protocol. 

# Usage

To start the server, simply run:

```bash
yarn
./run/cmd [-p <port>]
```

Both [Socket.io](http://socket.io) server and HTTP API will be listening at the specified port (default: 8746).

For example, if you want to send a message to the Diameter module, you will connect to the socket and emit a 'diameter' event.

# Diameter Module

This module relies on the [node-diameter](https://github.com/node-diameter/node-diameter/) library and exposes an API to manage connected peers and read the Diameter dictionary, as well as a socket to send and receive Diameter messages to any of the peers.

## HTTP API

- **GET** /diameter/peers
    - List all peers connected
- **POST** /diameter/peers
    - Connect to a new peer
    - Example:

        ```yaml
        {
          "host": "192.168.1.5",
          "port": 3868,
          "productName": "TRAFFIC.GEN",
          "originHost": "trafficgen",
          "localPort": 12557,
          "originRealm": "diameter.realm.com",
          "pingInterval": 10000,
          "applications": [
            "Diameter Credit Control Application",
            "3GPP Sy"
          ]
        }
        ```

- **DELETE** /diameter/peers/:localPort
    - Remove peer
- **GET** /diameter/dictionary
    - Returns the whole Diameter dictionary. This was taken from the [node-diameter-dictionary](https://github.com/node-diameter/node-diameter-dictionary) library (based on Wireshark's dictionary). It can be replaced with the DIAMETER_DICTIONARY environment variable.

## Socket

Allows the client to send and receive Diameter messages without being directly connected to the peers.

### Example

The code below starts a new Diameter session. When Traffic Gen receives a new session, it stores the Session Id so it can route messages from the Diameter server to the Socket client:

```tsx
import * as io from 'socket.io-client';

const timestampInSeconds = function (from: string = "1900-01-01T00:00:00Z"): number {
  return Math.floor((new Date().getTime() - new Date(from).getTime()) / 1000);
}

const header = {
	// peerId: 12345, // Peer Id is the local port of a connection to a peer. If not set, Traffic Gen will automatically select a peer that supports the specified application.
  application: 'Diameter Credit Control Application',
  command: 'Credit-Control',
  messageId: 1, // This is used to identify message answers.
  request: true
}

const initialRequest = {
  destinationHost: null,
  destinationRealm: null,
  serviceContextId: 'test@3gpp.org',
  sessionId: 'mySessionId',
  ccRequestType: 'INITIAL_REQUEST',
  ccRequestNumber: 0,
  authApplicationId: 'Diameter Credit Control Application',
  eventTimestamp: timestampInSeconds(),
  subscriptionId: {
    subscriptionIdType: 'END_USER_E164',
    subscriptionIdData: '5511918203248'
  },
  multipleServicesIndicator: 'MULTIPLE_SERVICES_SUPPORTED',
	[...]
}

socket.emit('diameter', header, initialRequest);
```

# TODO

- Better logging
- Allow modules names to be personalized
- Use monorepos to decouple it in small projects
- [Diameter] Auto-reconnect to peers
- [Diameter] Connect/disconnect peer endpoints should be raw CER and DPR commands instead of being normalized in an API. This should make it more flexible.
- [Diameter] Allow dictionaries to be personalized per request
