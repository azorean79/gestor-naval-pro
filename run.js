const next = require('next');
const http = require('http');
const dev = false;
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  http.createServer((req, res) => {
    handle(req, res);
  }).listen(3000, () => {
    console.log('OREY AZORES 26 server listening on port 3000');
  });
});
