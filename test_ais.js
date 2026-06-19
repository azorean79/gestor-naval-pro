require('dotenv').config({ path: '.env.local' });
const WebSocket = require('ws');
const url = 'wss://stream.aisstream.io/v0/stream';
const apiKey = process.env.AISSTREAM_API_KEY;

console.log('Connecting to AISStream for ANY MMSI Worldwide...');

const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('Connected. Subscribing Worldwide...');
    ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ['PositionReport']
    }));
});

let msgCount = 0;
ws.on('message', (data) => {
    msgCount++;
    console.log('Received Message', msgCount);
    if(msgCount >= 3) {
        console.log('Received 3 messages, closing...');
        ws.close();
    }
});

setTimeout(() => {
    console.log('Closing connection after 10s timeframe...');
    ws.close();
}, 10000);
