
/*============================================================================o\
    Send @object to @client.
\o============================================================================*/
function send(client, object){

    // Assemble output message.
    let msg = JSON.stringify(object);

    // Send message to client and log it.
    let cb = () => client.log.MSG_SENT(msg, client.token);
    client.socket.send(msg, {}, cb);
}

module.exports = {

    /*------------------------------------------------------------------------o\
        Send an error with @message to @client.
    \o------------------------------------------------------------------------*/
    error(client, message){
        send(client, { error: message });
    },

    /*------------------------------------------------------------------------o\
        Send a response containing @data from @endpoint to @client.
    \o------------------------------------------------------------------------*/
    response(endpoint, client, data){
        send(client, { endpoint: endpoint.name, data: data });
    },

    /*------------------------------------------------------------------------o\
        Send a new token for @client to store.
    \o------------------------------------------------------------------------*/
    token(client){
        send(client, { token: client.token });
    }

}
