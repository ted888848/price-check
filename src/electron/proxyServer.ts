import express from 'express'
import { GGCapi } from '@/lib/api'
function ProxyServer() {
  const server = express()
  server.use(express.json())
  server.listen('6969')

  server.post('/proxy', async (req, res) => {
    const { tradeURL, method, data } = req.body
    if (method === 'GET') {
      const response = await GGCapi.get(tradeURL)
      res.set(response.headers).send(response.data)
    }
    else if (method === 'POST') {
      const response = await GGCapi.post(tradeURL, data)
      res.set(response.headers).send(response.data)
    }
  })
}

ProxyServer()