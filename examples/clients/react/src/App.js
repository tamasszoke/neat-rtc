import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { join, signaling, send } from './components/Socket';
import NeatRTC from 'neat-rtc';

class App extends Component {
  constructor(props) {
    super(props);
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
    };
    this.rtc = new NeatRTC(config, sendSignalingMessage);
    // Socket.IO join messages from server
    join(message => {
      const { clientCount } = message;
      if (clientCount === 2) {
        this.rtc.connect();
      };
    })
    // Socket.IO signaling messages from server
    signaling(message => {
      this.rtc.handleSignaling(message);
    })
    this.state = {
      textMessage: '...'
    }
  }

  sendSignalingMessage = (message) => {
    send('signaling', message);
  }

  connected = () => {
    console.log('connected');
  }

  mediaStreamConnected = () => {
    console.log('stream connected');
  }

  mediaStreamRemoved = () => {
    console.log('stream removed');
  }
  
  mediaStreamRemoteRemoved = () => {
    console.log('remote stream removed');
  }

  datachannelOpen = (channel) => {
    console.log('datachannel open:', channel);
  }

  datachannelMessage = (channel, message) => {
    console.log('datachannel message:', channel, message);
    this.setState({
      textMessage: JSON.stringify(message)
    });
  }

  datachannelError = (channel) => {
    console.log('datachannel error:', channel);
  }

  datachannelClose = (channel) => {
    console.log('datachannel close:', channel);
  }

  startCamera = () => {
    this.rtc.media('start');
  }

  stopCamera = () => {
    this.rtc.media('stop');
  }

  stopRemoteCamera = () => {
    this.rtc.media('stopRemote');
    console.log('1')
  }

  sendText = () => {
    // eslint-disable-next-line
    const time = (new Date).toTimeString().slice(0,8);
    this.rtc.send('text', { time });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <div className="message-container">
          <h2>Datachannel message</h2>
          <h3>{ this.state.textMessage }</h3>
          <button onClick={ this.sendText }>Send message</button>
        </div>
        <div className="local-container">
          <h2>Local</h2>
          <video id="localVideo" width="300" height="200"></video>
          <button onClick={ this.startCamera }>Start camera</button>
          <button onClick={ this.stopCamera }>Stop camera</button>
        </div>
        <div className="remote-container">
          <h2>Remote</h2>
          <video id="remoteVideo" width="300" height="200"></video>
          <button onClick={ this.stopRemoteCamera }>Stop remote stream</button>
        </div>
      </div>
    );
  }
}

export default App;
