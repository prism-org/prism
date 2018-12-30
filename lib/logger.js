
/*============================================================================o\
    Centralize all text for logging.
\o============================================================================*/
let data = {
    MSG_RECVD: [ 'DEBUG', 'Received message ```%s´´´ from `%s´' ],
    MSG_SENT: [ 'DEBUG', 'Sent message ```%s´´´ to `%s´' ],
    BAD_JSON: [ 'DEBUG', 'Received malformed JSON ```%s´´´ from `%s´' ],
    CONN_DENIED: [ 'INFO', 'Connection denied for `%s´' ],
    TOKEN_RNEW: [ 'INFO', 'Connection `%s´ was named `%s´' ],
    TOKEN_RSET: [ 'INFO', 'Connection `%s´ was named `%s´' ],
    CONN_OPEN: [ 'INFO', 'Connection with `%s´ was established' ],
    CONN_CLOSE: [ 'INFO', 'Connection `%s´ was closed' ],
    UNKNOWN_EP: [ 'INFO', 'Could not handle enptoint `%s´' ]
    // Append new log messages as NAME: [ level, message ]
}

/*============================================================================o\
    Emit log event for parent, replacing placeholders in message.
\o============================================================================*/
function log(level, string, ...placeholders){
    let count = 0;
    let msg = string.replace(/%s/g, () => placeholders[count++]);
    this.emit('log', level, msg);
}

/*============================================================================o\
    Generate logging functions for all coded log messages.
\o============================================================================*/
module.exports = function(emitter){
    let o = {};
    for(let k in data)
        o[k] = log.bind(emitter, data[k][0], data[k][1]);
    return o;
};
