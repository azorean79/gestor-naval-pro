const args = process.argv.slice(2);
const mmsi = args[0] || '204709000';
require('dotenv').config({ path: '.env.local' });
const WebSocket = require('ws');
const url = 'wss://stream.aisstream.io/v0/stream';
const apiKey = process.env.AISSTREAM_API_KEY;

console.log('Connecting to AISStream for MMSI: ' + mmsi + ' for 60 seconds...');

const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('Connected.');
    ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FiltersShipMMSI: [mmsi],
        FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport']
    }));
});

ws.on('message', (data) => {
    const parsed = JSON.parse(data.toString());
    console.log('--- MSG RECEIVED ---');
    console.log('Name:', parsed.MetaData?.ShipName);
    console.log('Lat:', parsed.MetaData?.latitude, 'Lng:', parsed.MetaData?.longitude);
    console.log('Type:', parsed.MessageType);
});

setTimeout(() => {
    console.log('Timeout. Closing.');
    ws.close();
}, 60000);
