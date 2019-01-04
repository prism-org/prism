const EventEmitter = require('events');
const Outgoing = require('./outgoing');

/*============================================================================o\
    Instances of this class represent a API function or endpoint. They can be
    triggered to execute their associated logic. Endpoint listeners will usually
    interact with external services.
\o============================================================================*/
module.exports = class Endpoint extends EventEmitter{

    /*------------------------------------------------------------------------o\
        constructor
        - if @debug, listeners' errors will be thrown besides logged.
    \o------------------------------------------------------------------------*/
    constructor(name, debug){
        super();
        this.setMaxListeners(20);
        this.name = name;
        this.debug = debug || false;
    }

    /*------------------------------------------------------------------------o\
        Call all listeners for the 'trigger' event, passing @client and @data.
    \o------------------------------------------------------------------------*/
    trigger(client, data){
        this.emit('trigger', client, data);
    }

    /*------------------------------------------------------------------------o\
        Add @listener to the 'trigger' event, passing following context data:
        - this: client who triggered the endpoint
        - arg[0]: client's session object
        - arg[1]: input data sent by client
        - arg[2]: a function for the user to send responses to client
    \o------------------------------------------------------------------------*/
    register(listener){

        // Add the given listener to 'trigger' event.
        this.on('trigger', (client, data) => {

            // Grab session object for client.
            let sess = client.server.session.object[client.token] || {};

            // Bind send function with context data.
            let send = output => Outgoing.response(this, client, output);

            // Execute user listener passing context.
            try{
                listener.bind(client)(sess, data, send);
            }
            catch(e){

                // Log listeners' errors.
                client.server.emit('log', 'ERROR', e);
                if(this.debug){
                    Outgoing.error(client, e.message);
                    throw e;
                }
            }
        });

    }

}
