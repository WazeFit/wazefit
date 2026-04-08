import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = parseInt(process.env.PORT || '3000');
const DIR = path.join(import.meta.dirname, 'out');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain',
};

http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  let filePath = path.join(DIR, url);

  // Try exact file
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Try with .html
  if (fs.existsSync(filePath + '.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(filePath + '.html').pipe(res);
    return;
  }

  // Try index.html in dir
  const indexPath = path.join(filePath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  // SPA fallback → index.html
  const fallback = path.join(DIR, 'index.html');
  if (fs.existsSync(fallback)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(fallback).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
}).listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
