#!node

const fs = require('fs');
const toml = require('toml');
const Prism = require('../../lib/main');

(function(){
    try{
        let settings = toml.parse(fs.readFileSync('./test/dev/conf.toml'));
        let p = new Prism(settings);
        p.on('log', (level, msg) => console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''), level, msg) )

        p.endpoint(/hello/, (client, data, send) => send('HELLO!!'));

        function handle(){ p.close(); }

        process.on('SIGINT', handle);
        process.on('SIGTERM', handle);

        p.listen();
        console.log('%s listening at %s', p.name, p.port);
    }
    catch(e){
        console.log(e.message);
        console.log(e.stack || '');
    }
})();
