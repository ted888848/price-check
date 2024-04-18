import express from 'express'
import { GGCapi } from '@/lib/api'
function ProxyServer() {
  const server = express()
  server.use(express.json())
  server.listen('6969')

  server.post('/proxy', async (req, res) => {
    const data = req.body
    const { url } = req.query as { url: string }
    const response = await GGCapi.post(url, data, { headers: req.headers }).catch(err => err)
    res.status(response.status).set(response.headers).json(response.data)
  })
  server.get('/proxy', async (req, res) => {
    const { url } = req.query as { url: string }
    const response = await GGCapi.get(url, { headers: req.headers }).catch(err => err)
    res.status(response.status).set(response.headers).json(response.data)
  })
}

ProxyServer()