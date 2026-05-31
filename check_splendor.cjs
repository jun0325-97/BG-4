const fs = require('fs');
const text = fs.readFileSync('src/utils/popularGames.ts', 'utf-8');
const lines = text.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('스플')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
