import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/pyodide');
const destination = resolve(root, 'public/pyodide');

const FILES = [
    'pyodide.mjs',
    'pyodide.asm.mjs',
    'pyodide.asm.wasm',
    'python_stdlib.zip',
    'pyodide-lock.json',
];

if (!existsSync(source)) {
    console.error('[pyodide] node_modules/pyodide not found. Run npm install first.');
    process.exit(1);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });

for (const file of FILES) {
    const from = resolve(source, file);
    if (!existsSync(from)) {
        console.error(`[pyodide] Missing required asset: ${file}`);
        process.exit(1);
    }
    cpSync(from, resolve(destination, file));
}

console.log(`[pyodide] Copied ${FILES.length} assets to public/pyodide/`);
