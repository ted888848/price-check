import express from 'express'
import { GGCapi } from '@/lib/api'
import type { AxiosResponse } from 'axios'
function ProxyServer() {
  const server = express()
  server.use(express.json())
  server.listen('6969')

  server.post('/proxy', async (req, res) => {
    const { tradeURL, method } = req.body as ProxyData
    let response: AxiosResponse
    if (method === 'GET') {
      response = await GGCapi.get(tradeURL)
    }
    else if (method === 'POST') {
      const { data } = req.body as ProxyDataPost
      response = await GGCapi.post(tradeURL, data)
    }
    if (!response) res.status(500).send('No response')
    res.status(response.status).set(response.headers).send(response.data)
  })
}

ProxyServer()