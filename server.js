/* ==========================================================================
   Local preview server — no installs needed, only Node.js.
   Why: browsers block loading index.json when index.html is opened directly
   from a file (file://). Serving the folder over http:// fixes that.

   Usage:  node server.js            → http://localhost:5173
           node server.js --open     → same, and opens your browser
   (Or just double-click start.bat on Windows.)
   ========================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const START_PORT = Number(process.env.PORT) || 5173;
const OPEN_BROWSER = process.argv.includes('--open');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

function handler(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400); res.end('Bad request'); return;
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const file = path.resolve(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(buf);
  });
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd);
}

function listen(port, attemptsLeft = 10) {
  const server = http.createServer(handler);
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1); // port busy → try the next one
    } else {
      console.error(err.message);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('');
    console.log('  NFC Card preview is running:');
    console.log(`    Business card : ${url}`);
    console.log(`    Google reviews: ${url}/#reviews`);
    console.log('');
    console.log('  Edit index.json, then refresh the browser to see changes.');
    console.log('  Press Ctrl+C (or close this window) to stop.');
    console.log('');
    if (OPEN_BROWSER) openBrowser(url);
  });
}

listen(START_PORT);
