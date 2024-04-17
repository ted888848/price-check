import { config } from '@/electron/config'
import axios from 'axios'

import { CreateAxiosDefaults } from 'axios'

const baseURL = `${import.meta.env.VITE_URL_BASE}/api/`

export const apiBaseConfig: CreateAxiosDefaults = {
  baseURL: baseURL,
  timeout: 4000,
  withCredentials: true,
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
  },
}
export const GGCapi = axios.create(apiBaseConfig)

GGCapi.interceptors.request.use((request) => {
  const POESESSID = config.POESESSID
  if (POESESSID) {
    request.headers['Cookie'] = `POESESSID=${POESESSID};` + request.headers['Cookie']
  }
  return request
})