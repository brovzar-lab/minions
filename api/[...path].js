const https = require('https')
const http = require('http')
const { URL } = require('url')

const TARGET = (process.env.PAPERCLIP_API_URL || 'https://paperclip.billyrovzar.com').replace(/\/$/, '')
const API_KEY = process.env.PAPERCLIP_API_KEY || ''

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    })
    res.end()
    return
  }

  const url = new URL(req.url, 'http://localhost')
  const targetUrl = TARGET + url.pathname + url.search
  const parsed = new URL(targetUrl)
  const proto = parsed.protocol === 'https:' ? https : http

  const headers = { ...req.headers }
  delete headers['host']
  if (API_KEY) headers['authorization'] = `Bearer ${API_KEY}`
  headers['host'] = parsed.hostname

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: req.method,
    headers,
  }

  const proxyReq = proto.request(options, (proxyRes) => {
    const resHeaders = { ...proxyRes.headers, 'Access-Control-Allow-Origin': '*' }
    res.writeHead(proxyRes.statusCode || 502, resHeaders)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    if (!res.headersSent) res.writeHead(502)
    res.end('Proxy error: ' + err.message)
  })

  req.pipe(proxyReq)
}
