// Serveur local de démonstration : sert le site avec de FAUSSES données (demo/supabase-demo.js).
// Usage : node demo/serve.mjs [port]   puis ouvrir  http://127.0.0.1:8200/index.html?sc=full&h=21
// Rien ne touche à la vraie base Supabase. Aucune dépendance à installer.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +process.argv[2] || 8200;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  // La vraie bibliothèque Supabase est remplacée par la fausse base de démonstration.
  const file = p === '/vendor/supabase/supabase.js' ? path.join(root, 'demo', 'supabase-demo.js') : path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('introuvable'); }
  res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log('Site de démonstration : http://127.0.0.1:' + port + '/index.html?sc=full&h=21'));
