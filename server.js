const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me-in-production';
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'data', 'posts.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function readPosts() {
  if (!fs.existsSync(DB_PATH)) return [];
  const raw = fs.readFileSync(DB_PATH, 'utf8').trim();
  return raw ? JSON.parse(raw) : [];
}

function writePosts(posts) {
  fs.writeFileSync(DB_PATH, JSON.stringify(posts, null, 2));
}

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': MIME['.json'] });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function isAuthorized(req) {
  return req.headers['x-admin-token'] === ADMIN_TOKEN;
}

function serveFile(reqPath, res) {
  const clean = reqPath === '/' ? '/index.html' : reqPath;
  const filePath = path.join(ROOT, clean);
  if (!filePath.startsWith(ROOT)) return sendJson(res, 403, { error: 'Forbidden' });
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return sendJson(res, 404, { error: 'Not found' });
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, urlObj) {
  const pathname = urlObj.pathname;

  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, service: 'nnb-blog-api' });
  }

  if (pathname === '/api/posts' && req.method === 'GET') {
    const posts = readPosts().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return sendJson(res, 200, urlObj.searchParams.get('all') === '1' ? posts : posts.filter((p) => p.publishedAt));
  }

  if (pathname === '/api/posts' && req.method === 'POST') {
    if (!isAuthorized(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    const body = await parseBody(req);
    if (!body.title || typeof body.title !== 'string') return sendJson(res, 400, { error: 'title is required' });
    const posts = readPosts();
    const post = {
      id: `post-${Date.now()}`,
      title: body.title,
      summary: body.summary || '',
      content: body.content || '',
      type: body.type || 'Note',
      publishedAt: body.publishedAt || new Date().toISOString(),
      featured: Boolean(body.featured),
    };
    posts.push(post);
    writePosts(posts);
    return sendJson(res, 201, post);
  }

  const match = pathname.match(/^\/api\/posts\/([^/]+)$/);
  if (match) {
    const id = match[1];
    const posts = readPosts();
    const idx = posts.findIndex((p) => p.id === id);

    if (req.method === 'GET') {
      if (idx === -1) return sendJson(res, 404, { error: 'Post not found' });
      return sendJson(res, 200, posts[idx]);
    }

    if (req.method === 'PUT') {
      if (!isAuthorized(req)) return sendJson(res, 401, { error: 'Unauthorized' });
      if (idx === -1) return sendJson(res, 404, { error: 'Post not found' });
      const body = await parseBody(req);
      posts[idx] = { ...posts[idx], ...body, id };
      writePosts(posts);
      return sendJson(res, 200, posts[idx]);
    }

    if (req.method === 'DELETE') {
      if (!isAuthorized(req)) return sendJson(res, 401, { error: 'Unauthorized' });
      if (idx === -1) return sendJson(res, 404, { error: 'Post not found' });
      posts.splice(idx, 1);
      writePosts(posts);
      res.writeHead(204);
      return res.end();
    }
  }

  return sendJson(res, 404, { error: 'API route not found' });
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);

    if (urlObj.pathname.startsWith('/api/')) {
      return await handleApi(req, res, urlObj);
    }

    if (urlObj.pathname === '/admin') {
      return serveFile('/admin.html', res);
    }

    return serveFile(urlObj.pathname, res);
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`NNB blog running on http://localhost:${PORT}`);
});
