const fs = require("fs"); const lines = fs.readFileSync("src/app/jangadas/page.tsx", "utf8").split("\n"); console.log(lines.slice(1270, 1290).join("\n"));
