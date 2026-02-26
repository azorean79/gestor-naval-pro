const fs = require('fs');
const path = require('path');

const logPath = path.resolve(process.env.USERPROFILE || process.env.HOME, 'AppData\\Roaming\\Code\\User\\workspaceStorage\\c24bd79b93d409dab20fdeafe9ccaee1\\GitHub.copilot-chat\\chat-session-resources\\ceecb164-8a79-4aa5-be5c-1f22afc470af\\call_NmBAFr28OtsKbjDyH0n3tltN__vscode-1771943177082\\content.txt');

if (!fs.existsSync(logPath)) {
  console.error('Log file not found:', logPath);
  process.exit(2);
}

const content = fs.readFileSync(logPath, 'utf8');
const re = /updates: (\d+)/g;
let m;
let total = 0;
let cols = 0;
const details = [];
while ((m = re.exec(content)) !== null) {
  const v = Number(m[1]);
  details.push(v);
  if (v > 0) {
    cols++;
    total += v;
  }
}

console.log('columns_with_updates=' + cols);
console.log('total_rows_updated=' + total);
const top = details.filter(n=>n>0).slice(0,20);
if (top.length) {
  console.log('sample_updates_first20=' + top.join(','));
}

process.exit(0);
