import axios from 'axios'
const baseURL = 'https://web.poe.garena.tw/api/'
export const GGCapi = axios.create({
  baseURL: baseURL,
  timeout: 4000,
  withCredentials: true,
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
  }
})