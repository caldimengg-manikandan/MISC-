
const net = require('net');

const port = 5000;
const client = new net.Socket();

client.connect(port, '127.0.0.1', function() {
    console.log(`Port ${port} is in use (Server is likely running).`);
    client.destroy();
});

client.on('error', function(e) {
    console.log(`Port ${port} is NOT in use (Server is NOT running).`);
});
