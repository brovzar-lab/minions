/**
 * MINIONS VPS proxy server
 *
 * Serves the built React app and proxies /api/* to the local Paperclip instance.
 * Run on the same machine as Paperclip so it can reach localhost:3100.
 *
 * Usage:
 *   PAPERCLIP_API_KEY=<key> PAPERCLIP_COMPANY_ID=<id> node server.js
 *
 * Env vars:
 *   PORT                  - port to listen on (default: 4000)
 *   PAPERCLIP_API_URL     - Paperclip internal URL (default: http://localhost:3100)
 *   PAPERCLIP_API_KEY     - Bearer token for Paperclip API
 */

import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = parseInt(process.env.PORT || '4000', 10)
const PAPERCLIP_URL = (process.env.PAPERCLIP_API_URL || 'http://localhost:3100').replace(/\/$/, '')
const API_KEY = process.env.PAPERCLIP_API_KEY || ''
const DIST = path.join(__dirname, 'dist')

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
