import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const tsPath = path.join(__dirname, 'src', 'utils', 'popularGames.ts');
  const content = await fs.readFile(tsPath, 'utf-8');
  
  const lines = content.split('\n');
  const newLines = lines.filter(line => !line.includes('imageUrl: ""'));
  
  await fs.writeFile(tsPath, newLines.join('\n'), 'utf-8');
}

main().catch(console.error);
