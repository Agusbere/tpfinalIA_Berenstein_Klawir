import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function analyze(product, answers) {
  const resp = await axios.post(`${API_BASE}/api/analyze`, { product, answers })
  return resp.data
}

export async function chat(product, messages = []) {
  const resp = await axios.post(`${API_BASE}/api/chat`, { product, messages })
  return resp.data
}
