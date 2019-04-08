# Neat-RTC

[![npm version](https://badge.fury.io/js/neat-rtc.svg)](https://badge.fury.io/js/neat-rtc)
[![Build Status](https://travis-ci.org/tamasszoke/neat-rtc.svg?branch=master)](https://travis-ci.org/tamasszoke/neat-rtc)
[![Inline docs](http://inch-ci.org/github/tamasszoke/neat-rtc.svg?branch=master)](http://inch-ci.org/github/tamasszoke/neat-rtc)
![](https://img.shields.io/github/license/tamasszoke/neat-rtc.svg)

WebRTC wrapper with built-in signaling for React and Vue.

#### Overview:

	1. Install the package
	2. Import, configure, create an instance
	3. Wire up signaling on client-side
	4. Setup signaling on server-side
	5. Using mediastream, datachannel

## Install

	npm install neat-rtc

## Usage

### Import

    import NeatRTC from 'neat-rtc';

### Configure

    const config = {
      devMode: true,
      videoIdLocal: 'localVideo',
      videoIdRemote: 'remoteVideo',
      connected: connected,
      mediaStreamConnected: mediaStreamConnected,
      mediaStreamRemoved: mediaStreamRemoved,
      mediaStreamRemoteRemoved: mediaStreamRemoteRemoved,
      datachannels: [
        {
          name: 'text',
          callbacks: {
            open: datachannelOpen,
            message: datachannelMessage,
            error: datachannelError,
            close: datachannelClose
          }
        }
      ]
    };
    
**Important:** you have to set up all of the callback functions above.

**RTCPeerConnection configuration** (optional)

Add the following properties to the above `config` object.

`connectionConfig`: set the STUN/TURN servers and other connection options, for more information check the [RTCConfiguration dictionary](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#RTCConfiguration_dictionary).
Default value: 
        
    {
      iceServers: [
        {
          url: 'stun:stun.l.google.com:19302'
        }
      ]
    }

`optionalConfig`: set the optional connection configurations. Default value:

    {
      optional: [
        {
          DtlsSrtpKeyAgreement: true
        },
        {
          RtpDataChannels: false
        }
      ]
    }

### Create an instance

    rtc = new NeatRTC(config, sendSignalingMessage);

### Signaling (Socket.IO rooms)

#### Client-side
    
Start signaling when two client connects to the same room, using `join` namespace.

    join(message => {
      const { clientCount } = message;
      if (clientCount === 2) {
        rtc.connect();
      };
    })

Use your Socket.IO send function, messages **to** `signaling` namespace.

    sendSignalingMessage = (message) => {
      send('signaling', message);
    }

Use your Socket.IO receive function, messages **from** `signaling` namespace.

    signaling(message => {
      rtc.handleSignaling(message);
    })

#### Server-side

Joining connected clients to a room, using `join` namespace.

    const join = (room) => {
      // Count clients in room
      const clientCount = (typeof io.sockets.adapter.rooms[room] !== 'undefined') ? io.sockets.adapter.rooms[room].length : 0;
      // Check if client can join to the room
      if (clientCount < 2) {
        socket.join(room);
        socket.emit('join', { clientCount: clientCount+1 });
        console.log('Joined to room!');
      } else {
        console.log('Room is full!');
      };
    }

Messaging between clients during signaling, using `signaling` namespace.

    socket.on('signaling', message => {
      socket.to(room).emit('signaling', message);
    })

**Note:** you need to join the clients to the same room for signaling. You can find an example to this at the `./examples/server/` folder.

**Tip:** alternatively you can use your custom method to send/receive signaling messages between the clients.

## Using mediastream, datachannel

#### Start camera/mic

Basic

	rtc.media('start');

Better quality (hd720, hd1080)

	rtc.media('start', { resolution: 'hd720' });
	rtc.media('start', { resolution: 'hd1080' });
    
Voice only (without video)

	rtc.media('start', { voice: true });
    
#### Stop camera/stream

Local

	rtc.media('stop');
    
Remote (stop incoming stream)

	rtc.media('stopRemote');
    
#### Send message on datachannel

The message can be a string or an object.

	rtc.send('text', { content: 'Datachannel message' });

#### Receive a message on datachannel

Every datachannel message will arrive to the callback function you set, in this case it's the `datachannelMessage` function.

    datachannelMessage = (channel, message) => {
      console.log(channel, message);
    }

## Examples

Included [working examples](https://github.com/tamasszoke/neat-rtc) for React and Vue with a Node.js (Express, Socket.IO) server.

You have to run the client (React or Vue) and the server separately.

Start with running these in the root folder `./`

    npm install
    npm run build

To test the connection, open two browser tabs, they will connect automatically and you can use the built-in functions to try out mediastream and datachannel.

#### React

Navigate to the `./examples/client/react/` folder and run

    npm install
    npm start

Module imported in: `./examples/client/react/src/App.js`

#### Vue

Navigate to the `./examples/client/vue/` folder and run

    npm install
    npm run dev

Module imported in: `./examples/client/vue/src/components/Home.js`

#### Server

Navigate to the `./examples/server/` folder and run

    npm install
    npm start
    
## License

**The MIT License (MIT)**<br/>
Copyright (c) 2019 Tamas Szoke

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)