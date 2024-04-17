import { config } from '@/electron/config'
import axios from 'axios'
import { apiBaseConfig } from './config'


export const GGCapi = axios.create(apiBaseConfig)

GGCapi.interceptors.request.use((request) => {
  const POESESSID = config.POESESSID
  if (POESESSID) {
    request.headers['Cookie'] = `POESESSID=${POESESSID};` + request.headers['Cookie']
  }
  return request
})