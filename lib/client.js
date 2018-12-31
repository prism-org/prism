
const Incoming = require('./incoming');
const Outgoing = require('./outgoing');

/*============================================================================o\
    Verify if connection with bound client's socket is still alive.
\o============================================================================*/
function checkHealth(){

    // If client has not responded with pong, close the socket.
    /* istanbul ignore if */
    if(this.isAlive === false)
        return this.kill();

    // Assume the connection is dead.
    this.isAlive = false;

    // Ping the client for activity.
    /* istanbul ignore else */
    if(this.socket.readyState == 1)
        this.socket.ping();
}

/*============================================================================o\
    This class represents a new WebSocket client to consume prysmo endpoints.
\o============================================================================*/
module.exports = class client{

    /*------------------------------------------------------------------------o\
        Constructor
    \o------------------------------------------------------------------------*/
    constructor(server, socket){
        this.log = server.log;
        this.ip = socket._socket.remoteAddress;
        this.isAlive = true;
        this.server = server;
        this.token = 'null';
        this.socket = socket;
        this.log.CONN_OPEN(this.ip);

        // Set the check alive routine.
        this.timeout = setInterval(checkHealth.bind(this), this.server.settings.timeout || 3e3);

        // Handle client websocket events.
        socket.on('pong', () => this.isAlive = true);
        socket.on('message', msg => new Incoming(this, msg));
        socket.on('error', /* istanbul ignore next */ err => this.server.emit('log', 'ERROR', err) );
        socket.on('close', () => this.kill());
    }

    /*------------------------------------------------------------------------o\
        [Endpoint API] Trigger the @endpoint's listeners inputing @data.
    \o------------------------------------------------------------------------*/
    trigger(endpoint, data){

        // Log and return if given endpoint doesn't exist.
        if(!this.server.endpoints[endpoint])
            return this.log.UNKNOWN_EP(endpoint);

        // Trigger endpoint.
        this.server.endpoints[endpoint].trigger(this, data);
    }

    /*------------------------------------------------------------------------o\
        Attempt recovering for client a session block associated with @token.
    \o------------------------------------------------------------------------*/
    claimSession(token){
        let ot = this.token;
        this.token = token;

        // Ask session to recover it.
        this.token = this.server.session.recover(this);
        this.server.emit('log', 'DEBUG', this.server.session.object);

        // Send the new token to client.
        Outgoing.token(this);
        this.log.TOKEN_RSET(ot, this.token);
    }

    /*------------------------------------------------------------------------o\
        Breaks the websocket connection between client and server.
    \o------------------------------------------------------------------------*/
    kill(){
        this.socket.terminate();
        this.log.CONN_CLOSE(this.token);
        clearInterval(this.timeout);
    }
}
