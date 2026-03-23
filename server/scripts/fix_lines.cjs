const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../shared/schema.ts');
let lines = fs.readFileSync(schemaPath, 'utf-8').split(/\r?\n/);

const startIndex = lines.findIndex(l => l.includes('// AI Knowledge Base Tables (RAG)'));

if (startIndex !== -1 && startIndex < 1000) {
  // We know the block is exactly 36 lines long based on our previous view.
  lines.splice(startIndex, 36);
  fs.writeFileSync(schemaPath, lines.join('\r\n'));
  console.log('Successfully removed duplicate block by line splice!');
} else {
  console.log('Could not find duplicate block near top. StartIndex:', startIndex);
}
