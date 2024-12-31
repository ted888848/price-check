import { GGCapi } from './lib/api'
import { AxiosResponse, AxiosResponseHeaders } from 'axios'
import { ipcMain } from 'electron'
import IPC from '@/ipc'
import { Hono } from 'hono'
import { serve, ServerType } from '@hono/node-server'
import { ContentfulStatusCode } from 'hono/utils/http-status'

export class ProxyServer {
  private app: Hono
  private server: ServerType
  constructor() {
    this.app = new Hono()
    this.server = serve({
      fetch: this.app.fetch.bind(this.app),
      port: 0,
    })
    this.app.post('/proxy', async (c) => {
      const data = await c.req.json()
      const url = c.req.query('url')
      const response: AxiosResponse = await GGCapi.post(url, data).catch(err => err.response)
      return c.json(response.data, response.status as ContentfulStatusCode, response.headers as AxiosResponseHeaders)
    })
    this.app.get('/proxy', async (c) => {
      const url = c.req.query('url')
      const response: AxiosResponse = await GGCapi.get(url).catch(err => err.response)
      return c.json(response.data, response.status as ContentfulStatusCode, response.headers as AxiosResponseHeaders)
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
