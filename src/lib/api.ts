import axios from 'axios'
const baseURL = `${import.meta.env.VITE_URL_BASE}/api/`
export const GGCapi = axios.create({
  baseURL: baseURL,
  timeout: 4000,
  withCredentials: true,
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
  }
})