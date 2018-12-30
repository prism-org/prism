
const Outgoing = require('./outgoing');

/*============================================================================o\
    When instnced, will parse @message and handle it for @client.
\o============================================================================*/
module.exports = class Incoming{

    /*------------------------------------------------------------------------o\
        constructor
    \o------------------------------------------------------------------------*/
    constructor(client, message){

        // Attempt parsing input message and log it.
        try{
            var msg = JSON.parse(message);
            client.log.MSG_RECVD(message, client.token);
        }

        // If message is invalid, send error to client.
        catch(e){
            Outgoing.error(client, 'I received a malformed JSON');
            return client.log.BAD_JSON(message, client.token);
        }

        // If it is a token request, claim the given session.
        if(typeof msg.token == 'string')
            client.claimSession(msg.token);

        // If it tries to reach an endpoint, trigger it.
        if(typeof msg.endpoint == 'string')
            client.trigger(msg.endpoint, msg.data);
    }

}
