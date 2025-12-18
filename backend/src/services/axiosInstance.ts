import axios from 'axios'
import env from '@/config/env.config'

const axiosInstance = axios.create({
  baseURL: env.API_HOST,
  timeout: 15000, // 15 second timeout to prevent hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
})

export default axiosInstance
