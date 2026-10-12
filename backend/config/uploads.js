import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// config/ is one level below the project root, so go up one folder.
const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const uploadsDir = path.join(rootDir, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });