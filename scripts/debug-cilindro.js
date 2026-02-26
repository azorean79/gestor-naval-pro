const http = require('http');
const fs = require('fs');
const url = 'http://localhost:3000/api/cilindros/CIL-001';

function printLogs() {
  ['dev.err', 'dev.out'].forEach(f => {
    console.log('\n---', f, '---');
    try {
      if (fs.existsSync(f)) {
        const s = fs.readFileSync(f, 'utf8');
        const lines = s.split(/\r?\n/);
        const tail = lines.slice(Math.max(0, lines.length - 300)).join('\n');
        console.log(tail);
      } else {
        console.log(`(no ${f})`);
      }
    } catch (e) {
      console.error('ERR_READING', f, e.message);
    }
  });
}

const req = http.get(url, res => {
  console.log('STATUS', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('\n--- BODY START ---');
    console.log(body.slice(0, 10000));
    console.log('--- BODY END ---\n');
    printLogs();
  });
});
req.on('error', err => {
  console.error('REQUEST_ERROR', err.message);
  printLogs();
});
