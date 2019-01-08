/**
 * neat-rtc - github link...
 * @description
 * WebRTC wrapper for simple 1 to 1 applications
 * @license
 * Copyright (c) 2016 Tamas Szoke
 * Licensed under the MIT License
 * @version
 * Last modified: 2018-12-05
 * @example - Start connection with datachannel called 'text'
 * const config = {
 *   devMode: true,
 *   videoIdLocal: 'videoLocal',
 *   videoIdRemote: 'videoRemote',
 *   videoIdTest: 'testVideo',
 *   datachannels: [{
 *     name: '_default',
 *     binaryType: 'blob',
 *     callbacks: {
 *       open: onOpen,
 *       message: onMessage,
 *       error: onError,
 *       close: onClose
 *     }
 *   }]
 * }
 * let rtc = new RTC(config, socket);
 * rtc.connect();
 * @example - Start/stop camera, mic then send/remove the stream
 * rtc.media('start');
 * rtc.media('stop');
 * @example - Add/remove a datachannel
 * rtc.datachannel('add', 'channel-name');
 * rtc.datachannel('remove', 'channel-name');
 */

/**
 * Adapter.js
 */
// eslint-disable-next-line
import adapter from 'webrtc-adapter';

/**
 * Main function
 * @param {object} config
 * @param {function} sendCallback
 */
const webP2P = (config, sendCallback) => {
  const DEVELOPMENT_MODE = config.devMode;
  const DATACHANNEL_CONFIG = config.datachannels;
  let peerConnection = [];
  let datachannelList = [];
  let streamLocal = null;
  let streamRemote = null;
  let streamLocalConnected = false;
  let streamRemoteConnected = false;
  let videoIdLocal = config.videoIdLocal;
  let videoIdRemote = config.videoIdRemote;
  let connected = config.connected;
  let mediaStreamConnected = config.mediaStreamConnected;
  let mediaStreamRemoved = config.mediaStreamRemoved;
  let mediaStreamRemoteRemoved = config.mediaStreamRemoteRemoved;

  /**
   * Private functions
   */

  /**
   * Start webRTC connection
   * @param {string} connectionType
   */
  const initConnection = (connectionType) => {
    const CONFIGURATION = {
      "iceServers": [
        {
          "url": "stun:stun.l.google.com:19302"
        }
      ]
    };
    const OPTIONAL = {
      'optional': [
        {
          'DtlsSrtpKeyAgreement': true
        },
        {
          'RtpDataChannels': false
        }
      ]
    };
    peerConnection[connectionType] = new RTCPeerConnection(CONFIGURATION, OPTIONAL);
    peerConnection[connectionType].datachannelList = [];
    log('init connection: ' + connectionType);
  }

  /**
   * Disconnect
   */
  const initDisconnection = () => {
    // let videoElementLocal = document.getElementById(videoIdLocal);
    // videoElementLocal.pause();
    // if (streamLocal) {
    //   streamLocal.getVideoTracks()[0].stop();
    //   streamLocal.getAudioTracks()[0].stop();
    //   streamLocal = null;
    // }
    // streamLocalConnected = false;
    let videoElementRemote = document.getElementById(videoIdRemote);
    videoElementRemote.pause();
    if (streamRemote) {
      // streamRemote.getVideoTracks()[0].stop();
      // streamRemote.getAudioTracks()[0].stop();
      streamRemote = null;
    }
    // videoElementRemote.removeAttribute('src'); // Chrome 71...
    videoElementRemote.removeAttribute('srcObject');
    videoElementRemote.load();
    streamRemoteConnected = false;
    for (let i = 0; i < DATACHANNEL_CONFIG.length; i++) { // loop through the pre-defined datachannel list, and remove them
      datachannel('remove', DATACHANNEL_CONFIG[i].name);
    }
    if (peerConnection['media']) {
      peerConnection['media'].close();
      peerConnection['media'] = null;
    }
    if (peerConnection['data']) {
      peerConnection['data'].close();
      peerConnection['data'] = null;
    }
    log('disconnected');
  }

  /**
   * Start data connection
   * @param {string} messageType
   * @param {object} data
   */
  const initDataConnection = (messageType, data) => {
    const SDP_CONSTRAINTS = {
      'mandatory': {
        'OfferToReceiveAudio': false,
        'OfferToReceiveVideo': false
      }
    };
    initConnection('data');
    initDatachannel();
    if (messageType === 'sendOffer') {
      onIceCandidate('data');
      onDatachannel('data');
      createOffer('data', SDP_CONSTRAINTS);
    } else if (messageType === 'receiveOffer') {
      onIceCandidate('data');
      onDatachannel('data');
      peerConnection['data'].setRemoteDescription(new RTCSessionDescription(data));
      createAnswer('data', SDP_CONSTRAINTS);
      log('data stream -> offer received');
    }
  }

  /**
   * Start media connection
   * @param {string} messageType
   * @param {object} data
   */
  const initMediaConnection = (messageType, data) => {
    const MEDIA_CONSTRAINTS = {
      'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
      }
    };
    initConnection('media');
    onStreamAdd('media');
    // onStreamEnd('media');
    onIceCandidate('media');
    // onRenegotiationNeeded('media');
    if (streamLocal) {
      peerConnection['media'].addStream(streamLocal);
      log('media stream -> local stream added');
    }
    if (messageType === 'sendOffer') {
      createOffer('media', MEDIA_CONSTRAINTS);
    } else if (messageType === 'receiveOffer') {
      peerConnection['media'].setRemoteDescription(new RTCSessionDescription(data));
      createAnswer('media', MEDIA_CONSTRAINTS);
      log('media stream -> offer received');
    }
  }

  /**
   * Start datachannel(s)
   */
  const initDatachannel = () => {
    // add default datachannel
    datachannel('add', '_default');
    if (DATACHANNEL_CONFIG && DATACHANNEL_CONFIG.length > 0) { // check if theres a custom channel list
      for (let i = 0; i < DATACHANNEL_CONFIG.length; i++) { // loop through the pre-defined datachannel list, and start them
        datachannel('add', DATACHANNEL_CONFIG[i].name, DATACHANNEL_CONFIG[i].callbacks, DATACHANNEL_CONFIG[i].binaryType);
      }
    }
  }

  /**
   * Add datachannel to stream
   * @param {string} type
   * @param {string} channelName
   * @param {object} callbacks
   * @param {string} binaryType
   */
  const datachannel = (type, channelName, callbacks, binaryType) => {
    if (type.toLowerCase() === "add") {
      let channel = peerConnection['data'].createDataChannel(channelName, { reliable: true }); // reliable: true to be sure
      // channel.binaryType = 'blob';
      // if (binaryType) {
      //   channel.binaryType = binaryType;
      // }
      datachannelList[channelName] = channel;
      peerConnection['data'].datachannelList[channelName] = channel;
      if (channelName === '_default') {
        onDefaultDatachannelOpen(channelName);
        onDefaultDatachannelMessage(channelName);
        onDefaultDatachannelError(channelName);
        onDefaultDatachannelClose(channelName);
      }
      if (callbacks) {
        onDatachannelOpen(channelName, callbacks.open);
        onDatachannelMessage(channelName, callbacks.message);
        onDatachannelError(channelName, callbacks.error);
        onDatachannelClose(channelName, callbacks.close);
      }
      log('datachannel added: ' + channelName);
    } else if (type.toLowerCase() === "remove") {
      datachannelList[channelName].close();
      peerConnection['data'].datachannelList[channelName].close();
      log('datachannel removed: ' + channelName);
    }
  }

  /**
   * Create offer to connect
   * @param {string} connectionType 
   * @param {object} SDP_CONSTRAINTS 
   */
  const createOffer = (connectionType, SDP_CONSTRAINTS) => {
    peerConnection[connectionType].createOffer(function(description) {
      peerConnection[connectionType].setLocalDescription(description);
      log(connectionType + ' -> offer sent');
      sendCallback({
        type: 'receiveOffer',
        connectionType: connectionType,
        data: description
      })
    }, function(err) {
      log(err);
    }, SDP_CONSTRAINTS)
  }

  /**
   * Create answer to offer
   * @param {string} connectionType 
   * @param {object} SDP_CONSTRAINTS 
   */
  const createAnswer = (connectionType, SDP_CONSTRAINTS) => {
    peerConnection[connectionType].createAnswer(function(description) {
      peerConnection[connectionType].setLocalDescription(description);
      log(connectionType + ' -> answer sent');
      sendCallback({
        type: 'receiveAnswer',
        connectionType: connectionType,
        data: description
      })
    }, function(err) {
      log(err);
    }, SDP_CONSTRAINTS)
  }
  
  /**
   * Custom logging for development
   * @param {string} text
   */
  const log = (text) => {
    if (DEVELOPMENT_MODE) {
      const d = new Date();
      const hours = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
      const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
      const seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
      const time = hours + ':' + minutes + ':' + seconds;
      console.log('%c ' + time  + ' - ' + text + ' ', 'background: #222; color: #BADA55');
    }
  }

  /**
   * Event handlers
   */

  /**
   * Ice candidate event
   * @param {string} connectionType 
   */ 
  const onIceCandidate = (connectionType) => {
    peerConnection[connectionType].onicecandidate = function(e) {
      if (!peerConnection[connectionType] || !e || !e.candidate) {
        return
      } else {
        sendCallback({
          type: 'receiveCandidate',
          connectionType: connectionType,
          data: {
            label: e.candidate.sdpMLineIndex,
            id: e.candidate.sdpMid,
            candidate: e.candidate.candidate
          }
        })
      }
    }
  }

  /**
   * Datachannel received event
   * @param {string} connectionType 
   */
  const onDatachannel = (connectionType) => {
    peerConnection[connectionType].ondatachannel = function(e) {
      let channel = e.channel;
      datachannelList[channel.label] = channel;
      if (streamLocalConnected) {
        initMediaConnection('sendOffer');
      }
    }
  }

  /**
   * Stream added event
   * @param {string} connectionType 
   */
  const onStreamAdd = (connectionType) => {
    peerConnection[connectionType].onaddstream = function(e) {
      log('streamRemoteConnected: ' + streamRemoteConnected);
      if (!streamRemoteConnected) {
        streamRemote = e.stream;
        let videoElementRemote = document.getElementById(videoIdRemote);
        // videoElementRemote.src = window.URL.createObjectURL(streamRemote);
        videoElementRemote.srcObject = streamRemote;
        // videoElementRemote.src = streamRemote; // Chrome 71...
        videoElementRemote.play();
        streamRemoteConnected = true;
        log('media stream -> stream added');
      }
    }
  }

  /**
   * Datachannel open event
   * @param {string} channel
   * @param {function} callback
   */
  const onDefaultDatachannelOpen = (channel) => {
    peerConnection['data'].datachannelList[channel].onopen = function(e) {
      log('Datachannel opened "' + channel + '"');
      return connected()
    }
  }

  /**
   * Default datachannel ('_default') message event
   * @param {string} channel
   * @param {function} callback
   */
  const onDefaultDatachannelMessage = (channel) => {
    peerConnection['data'].datachannelList[channel].onmessage = function(e) {
      log('Datachannel message "' + channel + '"');
      let message = JSON.parse(e.data);
      message = message.message;
      switch (message.type) {
        case 'mediaStreamStart':
          // streamRemoteConnected = true;
          return mediaStreamConnected()
        case 'mediaStreamStop':
          streamRemoteConnected = false;
          let videoElementRemote = document.getElementById(videoIdRemote);
          videoElementRemote.pause();
          // if (streamRemote && streamRemote.getVideoTracks() && streamRemote.getVideoTracks()[0]) streamRemote.getVideoTracks()[0].stop();
          // if (streamRemote && streamRemote.getAudioTracks() && streamRemote.getAudioTracks()[0]) streamRemote.getAudioTracks()[0].stop();
          if (streamRemote) streamRemote = null;
          if (!message.NO_RESET) {
            // videoElementRemote.removeAttribute('src'); // Chrome 71...
            videoElementRemote.removeAttribute('srcObject');
            videoElementRemote.load();
          }
          return mediaStreamRemoved()
        case 'mediaStreamStopRemote':
          streamLocalConnected = false;
          log('Local stream false');
          if (peerConnection['media']) {
            peerConnection['media'].removeStream(streamLocal);
          }
          let videoElementLocal = document.getElementById(videoIdLocal);
          videoElementLocal.pause();
          if (streamLocal && streamLocal.getVideoTracks() && streamLocal.getVideoTracks()[0]) streamLocal.getVideoTracks()[0].stop();
          if (streamLocal && streamLocal.getAudioTracks() && streamLocal.getAudioTracks()[0]) streamLocal.getAudioTracks()[0].stop();
          if (streamLocal) streamLocal = null;
          if (!message.NO_RESET) {
            // videoElementLocal.removeAttribute('src'); // Chrome 71...
            videoElementLocal.removeAttribute('srcObject');
            videoElementLocal.load();
          }
          return mediaStreamRemoteRemoved();
        default:
          return false;
      }
    }
  }

  /**
   * Default datachannel ('_default') error event
   * @param {string} channel
   * @param {function} callback
   */
  const onDefaultDatachannelError = (channel) => {
    peerConnection['data'].datachannelList[channel].onerror = function(e) {
      log('Datachannel error "' + channel + '"');
    }
  }

  /**
   * Default datachannel ('_default') close event
   * @param {string} channel
   * @param {function} callback
   */
  const onDefaultDatachannelClose = (channel) => {
    peerConnection['data'].datachannelList[channel].onclose = function(e) {
      log('Datachannel closed "' + channel + '"');
    }
  }

  /**
   * Datachannel open event
   * @param {string} channel
   * @param {function} callback
   */
  const onDatachannelOpen = (channel, callback) => {
    peerConnection['data'].datachannelList[channel].onopen = function(e) {
      log('Datachannel opened "' + channel + '"');
      callback(channel);
    }
  }

  /**
   * Datachannel message event
   * @param {string} channel
   * @param {function} callback
   */
  const onDatachannelMessage = (channel, callback) => {
    peerConnection['data'].datachannelList[channel].onmessage = function(e) {
      // if (datachannelList[channel].binaryType === 'arraybuffer') {
      //   log('Datachannel message "' + channel + '"');
      //   callback(channel, e);
      // } else {
      log('Datachannel message "' + channel + '"');
      let message = JSON.parse(e.data);
      callback(channel, message);
      // }
    }
  }

  /**
   * Datachannel error event
   * @param {string} channel
   * @param {function} callback
   */
  const onDatachannelError = (channel, callback) => {
    peerConnection['data'].datachannelList[channel].onerror = function(e) {
      log('Datachannel error "' + channel + '"');
      callback(channel, e);
    }
  }

  /**
   * Datachannel close event
   * @param {string} channel
   * @param {function} callback
   */
  const onDatachannelClose = (channel, callback) => {
    peerConnection['data'].datachannelList[channel].onclose = function(e) {
      log('Datachannel closed "' + channel + '"');
      callback(channel, e);
    }
  }

  /**
   * Public functions
   */

  /**
   * Connect stream
   * @param {object} message
   */
  const connect = (message) => {
    if (!message) { // start peerconnection (data)
      log('Connecting...');
      initDataConnection('sendOffer', '');
    } else { // received the offer
      log('Connecting (offer)...');
      if (message.connectionType === 'data') {
        initDataConnection(message.type, message.data);
      } else if (message.connectionType === 'media') {
        initMediaConnection(message.type, message.data);
      }
    }
  }

  /**
   * Disconnect stream
   */
  const disconnect = () => {
    log('disconnecting...');
    initDisconnection();
  }

  /**
   * Start/stop local camera, microphone
   * @param {string} type
   * @param {object} options (resolution, voice, NO_MESSAGE, NO_RESET)
   */
  const media = (type, options) => { // 
    const { resolution, voice, NO_MESSAGE, NO_RESET } = options || false

    if (type.toLowerCase() === 'start') {

      // navigator.mediaDevices.enumerateDevices().then(function (devices) {
      //   for(let i = 0; i < devices.length; i++) {
      //     const DEVICE = devices[i];
      //     if (DEVICE.kind === 'videoinput') {
      //       console.log(DEVICE);
      //     }
      //   }
      // })

      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      let video = {
        mandatory: {
          minWidth: 320,
          minHeight: 240,
          maxWidth: 640,
          maxHeight: 480
        }
      };
      let videoElementLocal = document.getElementById(videoIdLocal);
      if (resolution && resolution.toLowerCase() === 'hd720') {
        video = {
          mandatory: {
            minWidth: 1280,
            minHeight: 720,
            maxWidth: 1280,
            maxHeight: 720
          }
        }
      } else if (resolution && resolution.toLowerCase() === 'hd1080') {
        video = {
          mandatory: {
            minWidth: 1920,
            minHeight: 1080,
            maxWidth: 1920,
            maxHeight: 1080
          }
        }
      };
      if (voice) video = false;
      const CONSTRAINTS = {
        audio: true,
        video: video
      };
      let getUserMediaSuccess = function(stream) {
        streamLocal = stream;
        videoElementLocal.srcObject = stream; // Chrome 71...
        // videoElementLocal.onloadeddata = function() {
        videoElementLocal.play();
        streamLocalConnected = true;
        log('Success access media');
        initMediaConnection('sendOffer');
        if (datachannelList && datachannelList['_default']) {
          const DATA = {
            channel: '_default',
            message: {
              type: 'mediaStreamStart',
              voice
            }
          }
          datachannelList['_default'].send(JSON.stringify(DATA));
          // datachannelList['media'].send(JSON.stringify(DATA));
        }
        log('Media stream -> offer sent');
      }
      let getUserMediaError = function(error) {
        log('Error access media');
        return false;
      }
      navigator.getUserMedia(CONSTRAINTS, getUserMediaSuccess, getUserMediaError);
    
    } else if (type.toLowerCase() === 'stop') {

      if (streamLocalConnected) {
        streamLocalConnected = false;
        log('Local stream false');
        if (peerConnection['media']) {
          peerConnection['media'].removeStream(streamLocal);
        }
        let videoElementLocal = document.getElementById(videoIdLocal);
        videoElementLocal.pause();
        if (streamLocal && streamLocal.getVideoTracks() && streamLocal.getVideoTracks()[0]) streamLocal.getVideoTracks()[0].stop();
        if (streamLocal && streamLocal.getAudioTracks() && streamLocal.getAudioTracks()[0]) streamLocal.getAudioTracks()[0].stop();
        if (streamLocal) streamLocal = null;
        if (!NO_RESET) {
          // videoElementLocal.removeAttribute('src'); // Chrome 71...
          videoElementLocal.removeAttribute('srcObject');
          videoElementLocal.load();
        }
        if (!NO_MESSAGE && datachannelList && datachannelList['_default']) {
          const DATA = {
            channel: '_default',
            message: {
              type: 'mediaStreamStop',
              voice,
              NO_RESET
            }
          }
          datachannelList['_default'].send(JSON.stringify(DATA));
          log('MediaStreamStop message sent');
        }
      }
    } else if (type.toLowerCase() === 'stopremote') {
      
      streamRemoteConnected = false;
      let videoElementRemote = document.getElementById(videoIdRemote);
      videoElementRemote.pause();
      // if (streamRemote && streamRemote.getVideoTracks() && streamRemote.getVideoTracks()[0]) streamRemote.getVideoTracks()[0].stop();
      // if (streamRemote && streamRemote.getAudioTracks() && streamRemote.getAudioTracks()[0]) streamRemote.getAudioTracks()[0].stop();
      if (streamRemote) streamRemote = null;
      if (!NO_RESET) {
        // videoElementRemote.removeAttribute('src'); // Chrome 71...
        videoElementRemote.removeAttribute('srcObject');
        videoElementRemote.load();
      }
      if (!NO_MESSAGE && datachannelList && datachannelList['_default']) {
        const DATA = {
          channel: '_default',
          message: {
            type: 'mediaStreamStopRemote',
            voice,
            NO_RESET
          }
        }
        datachannelList['_default'].send(JSON.stringify(DATA));
        log('MediaStreamStop message sent');
      }
    }
  }

  /**
   * Handle received candidate by socket
   * @param {object} message
   */
  const handleReceivedCandidate = (message) => {
    log(message.connectionType + ' -> answer received');
    const CANDIDATE = new RTCIceCandidate({
      sdpMLineIndex: message.data.label,
      candidate: message.data.candidate
    });
    peerConnection[message.connectionType].addIceCandidate(CANDIDATE);
  }

  /**
   * Send message through datachannel
   * @param {string} channel
   * @param {object} message
   */
  const send = (channel, message) => {
    // if (datachannelList[channel].binaryType === 'arraybuffer') {
    //   datachannelList[channel].send(message);
    // } else {
      // if (typeof message === 'string'){
      //   message = {message: message}
      // }
      // const DATA = {channel: channel, data: message};
      const DATA = message;
      datachannelList[channel].send(JSON.stringify(DATA));
    // }
  }

  /**
   * Handle received answer by socket
   * @param {string} message
   */
  const handleReceivedAnswer = (message) => {
    log(message.connectionType + ' -> answer received');
    streamRemote = message.data;
    peerConnection[message.connectionType].setRemoteDescription(new RTCSessionDescription(streamRemote));
  }

  const handleSignaling = (message) => {
    const { type } = message;
    switch (type) {
      case 'receiveOffer':
        connect(message);
      break
      case 'receiveAnswer':
        handleReceivedAnswer(message);
      break
      case 'receiveCandidate':
        handleReceivedCandidate(message);
      break
      default:
        return;
    };
  }

  /**
   * Check if a datachannel is connected
   * @param {string} channel
   * @returns {bool}
   */
  const checkConnection = (channel) => {
    if (peerConnection['data']) {
      let channelData = channel ? peerConnection['data'].datachannelList[channel] : peerConnection['data'].datachannelList['_default']
      let alive = channelData.readyState === 'open' ? true : false
      return alive
    } else {
      return false
    }
  }

  return {
    connect,
    disconnect,
    handleSignaling,
    checkConnection,
    media,
    send
  }
}

export default webP2P