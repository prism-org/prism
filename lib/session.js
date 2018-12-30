
const fs = require('fs');

/*============================================================================o\
    Load bound session' JSON content from disk.
\o============================================================================*/
function loadSession(){
    try{
        return JSON.parse(fs.readFileSync(this.file, 'utf-8'));
    }
    catch(e){
        return {};
    }
}

/*============================================================================o\
    Execute expiry for @token of bound session.
\o============================================================================*/
function expireClient(token){

    // Remove session block if expiry date is past.
    if(new Date(this.object[token].expiryDate) <= new Date())
        this.remove(token);
}

/*============================================================================o\
    This class represents a session storage for persisting client's state
    inbetween connections.
\o============================================================================*/
module.exports = class Session{

    /*------------------------------------------------------------------------o\
        constructor
    \o------------------------------------------------------------------------*/
    constructor(settings){
        this.object = {};
        this.persist = Boolean(settings.persist);

        // Define persistence settings.
        if(this.persist){
            this.expires = settings.expires;
            this.file = settings.backupFile || 'session.json';
            this.object = loadSession.bind(this)();

            // Defines an interval to save current state to disk.
            this.interval = setInterval(() => this.save(), settings.backupInterval * 60e3);
        }
    }

    /*------------------------------------------------------------------------o\
        Save the state to disk and empty data store.
    \o------------------------------------------------------------------------*/
    close(){
        if(this.persist){
            clearInterval(this.interval);
            this.save();
        }
        this.object = {};
    }

    /*------------------------------------------------------------------------o\
        Save state to disk.
    \o------------------------------------------------------------------------*/
    save(){
        if(!this.persist)
            return;

        // Verivy expiry for every token.
        if(this.expires)
            Object.keys(this.object).forEach( t => expireClient.bind(this)(t) );

        // Write stored data to disk.
        fs.writeFileSync(this.file, JSON.stringify(this.object), 'utf-8');
    }

    /*------------------------------------------------------------------------o\
        Add a new session block for client.
    \o------------------------------------------------------------------------*/
    add(client){

        // Generate a new token.
        var nt = require('uuid/v4')();

        // Define the standard session object.
        this.object[nt] = {
            address: client.ip
        };

        // Renew block's expiry date.
        this.renew(nt);

        // Return new token.
        return nt;
    }

    /*------------------------------------------------------------------------o\
        Attempt recovering a previous session block due to @client's
        reconnection.
        > If a session block with client's token doesn't exist, a new empty
        > session block will be silently returned in order to difficult session
        > hijacking.
    \o------------------------------------------------------------------------*/
    recover(client){
        let token = client.token;

        // Add a new session block.
        let nt = this.add(client);

        // Check if client's previous block exists.
        if(token && this.object[token]){

            // Move block to new token space and delete old token.
            this.object[nt] = this.object[token];
            this.remove(token);
        }

        // Renew expiry date and update ip address.
        this.renew(nt);
        this.object[nt].address = client.ip;

        // Return new token.
        return nt;
    }

    /*------------------------------------------------------------------------o\
        Remove the block associated with @token.
    \o------------------------------------------------------------------------*/
    remove(token){
        this.object[token] = null;
        delete this.object[token];
    }

    /*------------------------------------------------------------------------o\
        Postpones @token's block expiry date according to settings.
    \o------------------------------------------------------------------------*/
    renew(token){
        var ed = new Date();
        ed.setHours(ed.getHours() + this.expires);
        this.object[token].expiryDate = ed;
    }
}
