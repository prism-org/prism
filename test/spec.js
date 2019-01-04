const wtf = require('wtfnode');
const fs = require('fs');
const chai = require('chai');
chai.use(require('chai-fs'));
const assert = chai.assert;

const delay = s => new Promise(done => setTimeout(done, s * 1000));

const Prysmo = require('../lib/main');
const WebSocket = require('ws');

describe('Prysmo', () => {

    after(() => wtf.dump());

    describe('::constructor', () => {

        it('should create the prysmo instance', () => {
            let p = new Prysmo();
            assert.equal(typeof p.log, 'object');
        });

        it('should read settings object', () => {
            let p = new Prysmo({ custom: true });
            assert(p.settings.custom);
        });

    });

    describe('#listen', () => {

        it('should listen on default port', done => {
            let p = new Prysmo();
            p.listen();

            let c = new WebSocket('ws://localhost:7667');
            c.on('open', () => {
                p.close();
                done();
            });
        });

    });

    describe('#close', () => {

        it('should stop all server components', done => {
            let p = new Prysmo();
            p.listen();
            p.close();

            let c = new WebSocket('ws://localhost:7667');
            c.on('error', e => {
                assert(e);
                done();
            });
        });

        it('should throw on closing a closed server', () => {
            let p = new Prysmo();
            p.listen();
            p.close();
            assert.throws( () => p.close() );
        });

    });

    describe('#endpoint', () => {

        let p;
        beforeEach(() => {
            p = new Prysmo();
            p.listen();
        });

        afterEach(() => p.close());

        it('should fail when receiving wrong arguments', () => {
            assert.throws(() => p.endpoint());
        });

        it('should register an endpoint', () => {
            p.endpoint('test1', (s, d, send) => send('TEST 1') );
            assert.equal(p.endpoints['test1'].listenerCount('trigger'), 1);
        });

        it('should register multiple listeners to endpoint', () => {
            p.endpoint('test1', () => true );
            p.endpoint('test1', () => true );
            p.endpoint('test1', () => true );
            assert.equal(p.endpoints['test1'].listenerCount('trigger'), 3);
        });

        it('should throw errors when debug flag is up', done => {
            p.endpoint('error', () => { throw new Error('test') }, true );
            p.endpoint('proxy', function(){  assert.throws(() => this.trigger('error')); done() });
            let c = new WebSocket('ws://localhost:7667', ['prysmo']);
            c.on('open', () => c.send('{"endpoint":"proxy"}') );
        });

    });

    describe('Settings', () => {

        it('should listen on custom port [port]', done => {
            let p = new Prysmo({ port: 50 });
            p.listen();

            let c = new WebSocket('ws://localhost:50');
            c.on('open', () => {
                p.close();
                done();
            });
        });

        it('should require HTTPS handshake [secureOnly]', done => {
            let p = new Prysmo({ secureOnly: true });
            p.listen();

            let c = new WebSocket('ws://localhost:7667');
            c.on('unexpected-response', (o, r) => {
                assert.equal(r.statusCode, 426);
                assert(r.headers.upgrade);
                p.close();
                done();
            });
        });

        it('should ping at custom rate to check connection health [timeout]', function(done){
            this.timeout(10e3);

            let p = new Prysmo({ timeout: 6e3 });
            p.listen();

            let c = new WebSocket('ws://localhost:7667');
            c.on('ping', () => c.pong(async () => {
                await delay(1);
                p.close();
                done();
            }) );
        });

        describe('Session Persistence [session]', () => {

            it('should save session before closing [session.persist]', done => {
                let p = new Prysmo({ session: { persist: true } });
                p.listen();
                p.session.object.right = true;
                p.close();
                assert.fileContentMatch('./session.json', /right/);
                fs.unlink('./session.json', () => done());
            });

            it('should save session when required [session.persist]', done => {
                let p = new Prysmo({ session: { persist: true } });
                p.listen();
                p.session.object.right = true;
                p.session.save();
                assert.fileContentMatch('./session.json', /right/);
                p.close();
                fs.unlink('./session.json', () => done());
            });

            it('should not do anything when asked to save without persist [session.persist]', () => {
                let p = new Prysmo();
                p.listen();
                p.session.object.right = true;
                p.session.save();
                assert.notPathExists('./session.json');
                p.close();
            });

            it('should load session upon opening [session.persist]', done => {
                let p = new Prysmo({ session: { persist: true } });
                p.listen();
                p.session.object.right = true;
                p.close();

                assert(!p.session);

                p.listen();
                assert(p.session.object.right);
                p.close();
                fs.unlink('./session.json', () => done());
            });

            it.skip('should save session regularly [session.backupInterval]', () => {

            });

            it('should save session on custom file [session.backupFile]', done => {
                let p = new Prysmo({ session: {
                    persist: true,
                    backupFile: './custom.json'
                } });
                p.listen();
                p.session.object.right = true;
                p.close();
                assert.fileContentMatch('./custom.json', /right/);
                fs.unlink('./custom.json', () => done());
            });

            it('should remove expired sessions [session.expires]', done => {
                let p = new Prysmo({ session: {
                    persist: true,
                    expires: 1
                } });
                p.listen();

                let c = new WebSocket('ws://localhost:7667');
                c.on('open', () => c.send('{"token":"null"}') );
                c.on('message', e => {
                    let t = JSON.parse(e).token;
                    p.session.object[t].expiryDate = new Date();
                    p.close();
                    p.listen();
                    assert(!p.session.object[t]);
                    p.close();
                    done();
                });
            });

        });

        describe('TLS & HTTPS [ssl]', () => {

            it('should connect securely through TLS', done => {
                let p = new Prysmo({ ssl: {
                    key: './test/res/localhost.key',
                    cert: './test/res/localhost.cert'
                } });
                p.listen();

                let c = new WebSocket(
                    'wss://localhost:7667',
                    { rejectUnauthorized: false }
                );
                c.on('open', () => {
                    p.close();
                    done();
                });
            });

        });

    });

    describe('Interaction', () => {

        let p, c;
        beforeEach(() => {
            p = new Prysmo();
            p.listen();
            c = new WebSocket('ws://localhost:7667', ['other', 'prysmo']);
        });

        afterEach(() => {
            p.close();
            c.terminate();
        });

        describe('Prysmo Protocol', () => {

            it('should ping to check connection health', function(done){
                this.timeout(5000);
                c.on('ping', () => c.pong(async () => {
                    await delay(1);
                    done();
                }) );
            });

            it('should handout a new token when asked', done => {
                c.on('open', () => c.send('{"token":"null"}') );
                c.on('message', e => {
                    let m = JSON.parse(e);
                    assert.equal(typeof m.token, 'string');
                    done();
                });
            });

            it('should create a new session when unknown token is sent', done => {
                c.on('open', () => c.send('{"token":"null"}') );
                c.on('message', e => {
                    let t = JSON.parse(e).token;
                    assert.equal(typeof p.session.object[t], 'object');
                    done();
                });
            });

            it('should recover the session when correct token is sent', done => {
                c.once('open', () => c.send('{"token":"null"}') );
                c.once('message', e => {
                    let t = JSON.parse(e).token;
                    c.terminate();

                    p.session.object[t].test = true;

                    c = new WebSocket('ws://localhost:7667');
                    c.once('open', () => c.send('{"token":"' + t + '"}') );

                    c.once('message', e => {
                        let t = JSON.parse(e).token;
                        assert(typeof p.session.object[t].test);
                        done();
                    });
                });
            });

            it('should pick prysmo protocol', done => {
                c.on('open', () => {
                    assert.equal(c.protocol, 'prysmo');
                    done();
                });
            });

        });

        it('should log warning when bad JSON was received', done => {
            let t = 0;
            p.on('log', l => {
                t++;
                if(t == 2){
                    assert.equal(l, 'DEBUG');
                    done();
                }
            });

            c.on('open', () => c.send('{endpoint":"error"}') );
        });

        it('should log errors in handlers', done => {
            p.endpoint('error', () => { throw new Error('gotcha!') });

            let t = 0;
            p.on('log', l => {
                t++;
                if(t == 3){
                    assert.equal(l, 'ERROR');
                    done();
                }
            });

            c.on('open', () => c.send('{"endpoint":"error"}') );
        });

        it('should log when no handlers apply to endpoint', done => {
            let t = 0;
            p.on('log', l => {
                t++;
                if(t == 3){
                    assert.equal(l, 'INFO');
                    done();
                }
            });

            c.on('open', () => c.send('{"endpoint":"unknown"}') );
        });

        describe('Endpoint Listeners', () => {

            it('should expose session, input and server data to listeners', done => {
                p.endpoint('hello', function(s, d){
                    assert.equal(typeof s, 'object');
                    assert.equal(d, 5);
                    assert.equal(typeof this.server.settings, 'object');
                    done();
                });

                c.on('open', () => c.send('{"endpoint":"hello","data":5}') );
            });

            it('should send message when asked by listener', done => {
                p.endpoint('hello', (s, d, send) => send('success'), true );

                c.on('open', () => c.send('{"endpoint":"hello","data":"5"}') );
                c.on('message', e => {
                    let m = JSON.parse(e);
                    assert.equal(m.data, 'success');
                    done();
                });
            });

            it('should trigger another endpoint when asked', done => {
                p.endpoint('hello', (s, d, send) => send('success') );
                p.endpoint('proxy', function(){  this.trigger('hello') });

                c.on('open', () => c.send('{"endpoint":"proxy"}') );
                c.on('message', e => {
                    let m = JSON.parse(e);
                    assert.equal(m.endpoint, 'hello');
                    assert.equal(m.data, 'success');
                    done();
                });
            });

        });

    });

});
