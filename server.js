/**
 * MINIONS VPS proxy server
 *
 * Serves the built React app and proxies /api/* to the local Paperclip instance.
 * Run on the same machine as Paperclip so it can reach it via Caddy on port 80.
 *
 * Usage:
 *   PORT=4001 node server.js
 *
 * Env vars:
 *   PORT                  - port to listen on (default: 4001)
 *   PAPERCLIP_API_URL     - Paperclip URL (default: http://localhost — via Caddy on port 80)
 *   PAPERCLIP_API_KEY     - Bearer token (auto-refreshed via /internal/refresh-key)
 */

import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = parseInt(process.env.PORT || '4001', 10)
// Paperclip is served via Caddy on port 80 on this VPS host.
// Do NOT use localhost:3100 — that is a different Python service on this host.
const PAPERCLIP_URL = (process.env.PAPERCLIP_API_URL || 'http://localhost').replace(/\/$/, '')
const DIST = path.join(__dirname, 'dist')

// Key management: reads from /tmp/.minions-key file (auto-refreshed by Paperclip routine)
// Falls back to PAPERCLIP_API_KEY env var if file missing.
const KEY_FILE = '/tmp/.minions-key'
let API_KEY = process.env.PAPERCLIP_API_KEY || ''

function loadKey() {
  try {
    const fromFile = fs.readFileSync(KEY_FILE, 'utf8').trim()
    if (fromFile && fromFile !== API_KEY) {
      API_KEY = fromFile
      console.log('API key refreshed from', KEY_FILE)
    }
  } catch { /* file missing — keep current key */ }
}

loadKey()
setInterval(loadKey, 30 * 60 * 1000) // reload every 30 minutes

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function proxyRequest(req, res, targetUrl) {
  const parsed = new URL(targetUrl)
  const proto = parsed.protocol === 'https:' ? https : http

  const proxyHeaders = { ...req.headers }
  delete proxyHeaders['host']
  if (API_KEY) proxyHeaders['authorization'] = `Bearer ${API_KEY}`
  proxyHeaders['host'] = parsed.hostname

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: req.method,
    headers: proxyHeaders,
  }

  const proxyReq = proto.request(options, (proxyRes) => {
    const resHeaders = { ...proxyRes.headers, 'access-control-allow-origin': '*' }
    res.writeHead(proxyRes.statusCode ?? 502, resHeaders)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    if (!res.headersSent) res.writeHead(502)
    res.end('Paperclip proxy error: ' + err.message)
  })

  req.pipe(proxyReq)
}

function serveStatic(res, filePath) {
  try {
    const content = fs.readFileSync(filePath)
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(content)
  } catch {
    const fallback = path.join(DIST, 'index.html')
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(fs.readFileSync(fallback))
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' })
    res.end()
    return
  }

  // Key refresh: Paperclip agent POSTs { key } here via Docker bridge (internal only)
  if (url.pathname === '/internal/refresh-key' && req.method === 'POST') {
    const remote = req.socket.remoteAddress ?? ''
    const allowed = remote === '::1' || remote === '127.0.0.1' || remote.startsWith('172.17.')
    if (!allowed) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { key } = JSON.parse(body)
        if (key && typeof key === 'string') {
          API_KEY = key
          console.log('API key refreshed via /internal/refresh-key')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end('{"ok":true}')
        } else {
          res.writeHead(400)
          res.end('{"error":"key field required"}')
        }
      } catch {
        res.writeHead(400)
        res.end('{"error":"invalid JSON"}')
      }
    })
    return
  }

  if (url.pathname.startsWith('/api/')) {
    proxyRequest(req, res, PAPERCLIP_URL + url.pathname + url.search)
    return
  }

  const filePath = path.join(DIST, url.pathname)
  const exists = fs.existsSync(filePath) && fs.statSync(filePath).isFile()
  serveStatic(res, exists ? filePath : path.join(DIST, 'index.html'))
})

server.listen(PORT, () => {
  console.log(`MINIONS running at http://localhost:${PORT}`)
  console.log(`Proxying Paperclip API: ${PAPERCLIP_URL}`)
  if (!API_KEY) console.warn('Warning: PAPERCLIP_API_KEY not set — API requests will be unauthenticated')
})
