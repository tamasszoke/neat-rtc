<template>
  <div id="app">
    <div class="message-container">
      <h2>Datachannel message</h2>
      <h3>{{ textMessage }}</h3>
      <button @click="sendText">Send message</button>
    </div>
    <div class="local-container">
      <h2>Local</h2>
      <video id="localVideo" width="300" height="200"></video>
      <button @click="startCamera">Start camera</button>
      <button @click="stopCamera">Stop camera</button>
    </div>
    <div class="remote-container">
      <h2>Remote</h2>
      <video id="remoteVideo" width="300" height="200"></video>
      <button @click="stopRemoteCamera">Stop remote stream</button>
    </div>
    <router-view/>
  </div>
</template>

<script>
import { join, signaling, send } from './connect/Socket'
import NeatRTC from 'neat-rtc'

export default {
  name: 'App',
  data () {
    return {
      rtc: null,
      textMessage: '...'
    }
  },
  mounted () {
    // Setup NeatRTC
    const {
      connected,
      mediaStreamConnected,
      mediaStreamRemoved,
      datachannelOpen,
      datachannelMessage,
      datachannelError,
      datachannelClose,
      sendSignalingMessage,
      mediaStreamRemoteRemoved
    } = this
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
    }
    this.rtc = new NeatRTC(config, sendSignalingMessage)
    // Socket.IO join messages from server
    join(message => {
      const { clientCount } = message
      if (clientCount === 2) {
        this.rtc.connect()
      }
    })
    // Socket.IO signaling messages from server
    signaling(message => {
      this.rtc.handleSignaling(message)
    })
  },
  methods: {
    sendSignalingMessage (message) {
      send('signaling', message)
    },
    connected () {
      console.log('connected')
    },
    mediaStreamConnected () {
      console.log('stream connected')
    },
    mediaStreamRemoved () {
      console.log('stream removed')
    },
    mediaStreamRemoteRemoved () {
      console.log('remote stream removed')
    },
    datachannelOpen (channel) {
      console.log('datachannel open:', channel)
    },
    datachannelMessage (channel, message) {
      console.log('datachannel message:', channel, message)
      this.textMessage = JSON.stringify(message)
    },
    datachannelError (channel) {
      console.log('datachannel error:', channel)
    },
    datachannelClose (channel) {
      console.log('datachannel close:', channel)
    },
    startCamera () {
      this.rtc.media('start')
    },
    stopCamera () {
      this.rtc.media('stop')
    },
    stopRemoteCamera () {
      this.rtc.media('stopRemote')
      console.log('1')
    },
    sendText () {
      // eslint-disable-next-line
      const time = (new Date).toTimeString().slice(0,8)
      this.rtc.send('text', { time })
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

/* Custom styles */

.local-container{
  position: absolute;
  left: 0;
  top: 0;
  margin: 10px;
  text-align: left;
  width: 300px;
}

.local-container video{
  background: black;
}

.local-container button{
  display: inline-block;
  width: 49%;
  font-size: 18px;
  padding: 5px;
}

.remote-container{
  position: absolute;
  right: 0;
  top: 0;
  margin: 10px;
  text-align: right;
  width: 300px;
}

.remote-container video{
  background: black;
}

.remote-container button{
  display: inline-block;
  width: 100%;
  font-size: 18px;
  padding: 5px;
}

.message-container{
  position: absolute;
  left: 0;
  bottom: 0;
  margin: 10px;
  width: 300px;
}

.message-container button{
  display: inline-block;
  width: 100%;
  font-size: 18px;
  padding: 5px;
}
</style>
