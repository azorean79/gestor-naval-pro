const fs = require('fs');
const file = 'src/app/agenda/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const parts = content.split('export default AgendaPage;');
if (parts.length > 2) {
  // It means export default AgendaPage appears more than once.
  // We keep everything up to the first 'export default AgendaPage;' + the string itself.
  const newContent = parts[0] + 'export default AgendaPage;\n';
  fs.writeFileSync(file, newContent);
  console.log("Successfully removed duplicate code block!");
} else {
  console.log("No duplicate 'export default AgendaPage;' found.");
}
