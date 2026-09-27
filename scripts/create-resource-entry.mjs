import { readFile, writeFile } from 'node:fs/promises'

// Django's resource document loads the exact same build as index.html, without
// copying frontend artifacts into backend images or starting a Node SSR server.
const output = new URL('../dist/', import.meta.url)
const html = await readFile(new URL('index.html', output), 'utf8')
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(match => match[1])
const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(match => match[1])
if (!scripts.length || !styles.length || [...scripts, ...styles].some(path => !path.startsWith('/assets/'))) {
  throw new Error('Cannot find local frontend entry assets in dist/index.html')
}
await writeFile(new URL('resource-entry.js', output), scripts.map(path => `import ${JSON.stringify(path)};`).join('\n') + '\n')
await writeFile(new URL('resource-entry.css', output), styles.map(path => `@import url(${JSON.stringify(path)});`).join('\n') + '\n')
