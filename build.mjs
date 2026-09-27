#!/usr/bin/env node
// Builds the deployable site into dist/. No dependencies.
//
//   node build.mjs                   build into dist/
//   node build.mjs --out <dir>       build into another folder
//   node build.mjs --version 9.9.9   override the version (the update test uses this)
//
// The version number lives in version.json only. This script puts it everywhere else.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = import.meta.dirname;
const arg = name => {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const OUT = resolve(ROOT, arg('out') || 'dist');

// The site. Every other file in the repo stays out of the deployment.
const SITE = ['index.html', 'style.css', 'manifest.json', 'js', 'icons', 'vendor', 'media'];
const EXCLUDE = ['icons/generate-icons.html', 'media/screenshot1.jpg', 'media/screenshot2.jpg'];
// Larger files are cached on first use, not downloaded at install
const LAZY_BYTES = 2 * 1024 * 1024;

const sha = data => createHash('sha256').update(data).digest('hex');
const must = (ok, message) => { if (!ok) { console.error('build failed: ' + message); process.exit(1); } };

function buildDate() {
  // Date of the last commit, so the same commit always gives the same build
  try {
    return execSync('git log -1 --format=%cs', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const version = arg('version') || JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8')).version;
must(/^\d+\.\d+\.\d+$/.test(version), `version "${version}" is not in the form 1.2.3`);

rmSync(OUT, { recursive: true, force: true });
for (const entry of SITE) cpSync(join(ROOT, entry), join(OUT, entry), { recursive: true });
for (const path of EXCLUDE) rmSync(join(OUT, path), { force: true });

writeFileSync(join(OUT, 'version.json'), JSON.stringify({ version, build: buildDate() }, null, 2) + '\n');

// index.html: mark as built (this turns the service worker on) and stamp local scripts and styles
let html = readFileSync(join(OUT, 'index.html'), 'utf8');
must(html.includes('<html '), 'index.html has no <html> tag with attributes');
html = html.replace('<html ', `<html data-build="${version}" `);
let stamped = 0;
html = html.replace(/\b(src|href)="((?!https?:|data:|\/\/)[^"?#]+\.(?:js|css))"/g, (_, attr, url) => {
  stamped++;
  return `${attr}="${url}?v=${version}"`;
});
must(stamped > 0, 'index.html has no local script or style to stamp');
writeFileSync(join(OUT, 'index.html'), html);

// File lists for the service worker
const files = readdirSync(OUT, { recursive: true, withFileTypes: true })
  .filter(e => e.isFile())
  .map(e => join(e.parentPath, e.name).slice(OUT.length + 1).replaceAll('\\', '/'))
  .sort();
const precache = [];
const media = {};
const digest = createHash('sha256');
let precacheBytes = 0;
for (const path of files) {
  const data = readFileSync(join(OUT, path));
  if (data.length > LAZY_BYTES) {
    media[path] = sha(data).slice(0, 16);
  } else {
    precache.push(path);
    precacheBytes += data.length;
    // version.json holds the build date. Keep it out of the hash: a new date alone is not a new release.
    if (path !== 'version.json') digest.update(path + '\0' + sha(data) + '\n');
  }
}
digest.update(JSON.stringify(media));

let sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
for (const mark of ['__VERSION__', '__HASH__', '__PRECACHE__', '__MEDIA__']) {
  must(sw.includes(mark), `sw.js has no ${mark} placeholder`);
}
sw = sw
  .replace('__VERSION__', version)
  .replace('__HASH__', digest.digest('hex').slice(0, 12))
  .replace('__PRECACHE__', JSON.stringify(precache, null, 2))
  .replace('__MEDIA__', JSON.stringify(media, null, 2));
writeFileSync(join(OUT, 'sw.js'), sw);

const mb = n => (n / 1024 / 1024).toFixed(1) + ' MB';
console.log(`KidsOS ${version} -> ${OUT}`);
console.log(`  ${precache.length} files at install (${mb(precacheBytes)}), ${Object.keys(media).length} on first use, ${stamped} tags stamped`);
