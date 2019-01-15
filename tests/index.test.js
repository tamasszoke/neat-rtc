import { expect } from 'chai';
import NeatRTC from '../build/index.js';

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
    expect(rtc).to.be.an('object') &&
    expect(rtc).to.have.property('connect') &&
    expect(rtc).to.have.property('disconnect') &&
    expect(rtc).to.have.property('handleSignaling') &&
    expect(rtc).to.have.property('checkConnection') &&
    expect(rtc).to.have.property('media') &&
    expect(rtc).to.have.property('send');
  })
})