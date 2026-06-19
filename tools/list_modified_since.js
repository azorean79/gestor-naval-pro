const fs = require('fs');
const path = require('path');

const cutoff = new Date('2026-03-03T00:00:00Z');
const root = process.cwd();

function walk(dir) {
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    try {
      const st = fs.statSync(full);
      if (st.isFile()) {
        if (st.mtime > cutoff) res.push({ path: full, mtime: st.mtime.toISOString() });
      } else if (st.isDirectory()) {
        res.push(...walk(full));
      }
    } catch (e) {
      // ignore
    }
  }
  return res;
}

const files = walk(root);
console.log(JSON.stringify(files, null, 2));
