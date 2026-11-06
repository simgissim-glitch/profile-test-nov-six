'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const hostname = '127.0.0.1';
const port = Number(process.env.PORT || 3000);
// Serve only the public files belonging to this profile page.
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/profile.svg', ['profile.svg', 'image/svg+xml']],
]);

const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url, `http://${hostname}:${port}`).pathname;
  } catch {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }

  // Browsers may request a favicon even when the page does not declare one.
  if (pathname === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }

  const file = files.get(pathname);
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : 'Not Found');
    return;
  }

  try {
    const content = await fs.readFile(path.join(__dirname, file[0]));
    response.writeHead(200, {
      'Content-Type': file[1],
      'Content-Length': content.length,
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    console.error(`Unable to read ${file[0]}:`, error.message);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : 'Internal Server Error');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Stop the other server and run npm start again.`
    : `Server error: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, hostname, () => {
  console.log(`Profile website running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop.');
});
