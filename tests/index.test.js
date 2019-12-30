import { expect } from 'chai';
import NeatRTC from '../dist/index.js';

describe('NeatRTC Component', () => {

  let config = {
    devMode: true,
    videoIdLocal: 'localVideo',
    videoIdRemote: 'remoteVideo',
    connected: () => {},
    mediaStreamConnected: () => {},
    mediaStreamRemoved: () => {},
    mediaStreamRemoteRemoved: () => {},
    datachannels: [
      {
        name: 'text',
        callbacks: {
          open: () => {},
          message: () => {},
          error: () => {},
          close: () => {}
        }
      }
    ]
  };

  it('should load the component', () => {
    let configNull = null;
    let configNotValid = { devMode: true };
    let rtc = null;
    expect(() => { rtc = new NeatRTC(configNull); }).to.throw('Parameters not set!') &&
    expect(() => { rtc = new NeatRTC(configNull, () => {}); }).to.throw('Parameters not set!') &&
    expect(() => { rtc = new NeatRTC(configNotValid); }).to.throw('Parameters not set!') &&
    expect(() => { rtc = new NeatRTC(configNotValid, () => {}); }).to.throw('Parameters not correctly set!') &&
    expect(() => { rtc = new NeatRTC(config, () => {}); }).to.not.throw(Error) &&
    expect(rtc).to.be.an('object');
  })

  it('should have the connect property', () => {
    let rtc = new NeatRTC(config, () => {});
    expect(rtc).to.have.property('connect');
  })

  it('should have the disconnect property', () => {
    let rtc = new NeatRTC(config, () => {});
    expect(rtc).to.have.property('disconnect');
  })

  it('should have the handleSignaling property', () => {
    let rtc = new NeatRTC(config, () => {});
    expect(rtc).to.have.property('handleSignaling');
  })

  it('should have the checkConnection property', () => {
    let rtc = new NeatRTC(config, () => {});
    expect(rtc).to.have.property('checkConnection');
  })

  it('should have the media property', () => {
    let rtc = new NeatRTC(config, () => {});
    expect(rtc).to.have.property('media');
  })

  it('should have the send property', () => {
    let rtc = new NeatRTC(config, () => {});
    expect(rtc).to.have.property('send');
  })
})