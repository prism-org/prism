const assert = require('assert');
const fs = require('fs');
const https = require('https');
const ws = require('ws');
const EventEmitter = require('events');
const getLogger = require('./logger');
const Session = require('./session');
const Client = require('./client');
const Endpoint = require('./endpoint');

/*============================================================================o\
    Check whether connection @info comply with security settings.
\o============================================================================*/
function handleSecurity(info, cb){
    let r = !this.settings.secureOnly || info.secure;
    cb(r, 426, 'Please, use HTTPS.', { 'Upgrade': 'TLS/1.1' });
    if(!r)
        this.log.CONN_DENIED(info.req.socket.remoteAddress);
}

/*============================================================================o\
    This class represents the Prysmo server and is the key component of the prysmo
    architecture.
\o============================================================================*/
module.exports = class Prysmo extends EventEmitter{

    /*------------------------------------------------------------------------o\
        Constructor
    \o------------------------------------------------------------------------*/
    constructor(settings){
        super();
        settings = settings || {};
        this.log = getLogger(this);
        this.settings = settings;
        this.name = 'Prysmo API Gateway';
        this.port = settings.port || 7667;
        this.endpoints = [];
    }

    /*------------------------------------------------------------------------o\
        Start listening for connections according to settings.
    \o------------------------------------------------------------------------*/
    listen(){

        // Start the session storage.
        this.session = new Session(this.settings.session || {});

        // Define initial websocket server settings.
        let wsOpts = {
            verifyClient: handleSecurity.bind(this),
            handleProtocols: () => 'prysmo'
        };

        // Start a HTTPS server if SSL was setup.
        if(this.settings.ssl && this.settings.ssl.key && this.settings.ssl.cert){
            wsOpts.server = https.createServer({
                key: fs.readFileSync(this.settings.ssl.key),
                cert: fs.readFileSync(this.settings.ssl.cert)
            });
            wsOpts.server.listen(this.settings.port || 7667);
        }
        else
            wsOpts.port = this.settings.port || 7667;

        // Start WebSocket server according to settings.
        this.server = new ws.Server(wsOpts);
        this.server.on('connection', socket => new Client(this, socket));
        this.server.on('error', /* istanbul ignore next */ e => this.emit('log', 'ERROR', e) );
    }

    /*------------------------------------------------------------------------o\
        Stop all server operations and reset it's state.
    \o------------------------------------------------------------------------*/
    close(){
        this.server._server.close();
        this.server.close();
        this.session.close();
        this.session = null;
        this.server = null;
    }

    /*------------------------------------------------------------------------o\
        Add @listener to @name endpoint.
    \o------------------------------------------------------------------------*/
    endpoint(name, listener, debug){
        assert.equal(typeof name, 'string');
        assert.equal(typeof listener, 'function');

        // Create endpoint if it did not exist.
        if(!this.endpoints[name])
            this.endpoints[name] = new Endpoint(name, debug);

        // Add listener to given endpoint.
        this.endpoints[name].register(listener);
    }

}
