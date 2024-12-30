import express from 'express'
import { GGCapi } from './lib/api'
import { AxiosResponse } from 'axios'
import { Server } from 'node:http'
import { ipcMain } from 'electron'
import IPC from '@/ipc'

export class ProxyServer {
  private server: Server
  constructor() {
    const app = express()
    app.use(express.json())
    this.server = app.listen(0)

    app.post('/proxy', async (req, res) => {
      const data = req.body
      const { url } = req.query as { url: string }
      const response: AxiosResponse = await GGCapi.post(url, data).catch(err => err.response)
      res.status(response.status).set(response.headers).json(response.data)
    })
    app.get('/proxy', async (req, res) => {
      const { url } = req.query as { url: string }
      const response: AxiosResponse = await GGCapi.get(url).catch(err => err.response)
      res.status(response.status).set(response.headers).json(response.data)
    })
    ipcMain.on(IPC.GET_PROXY_PORT, (e) => {
      e.returnValue = this.getPort()
    })
  }

  getPort() {
    const address = this.server.address()
    if (typeof address === 'string') return parseInt(address.split(':').at(1) as string, 10)
    else return address.port
  }
}
export const proxyServer: ProxyServer = new ProxyServer()
