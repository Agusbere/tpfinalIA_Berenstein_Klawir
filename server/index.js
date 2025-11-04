import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'
import pkg from 'pg'
import { exec } from 'child_process'

dotenv.config()
const { Pool } = pkg

const PORT = process.env.PORT || 4000
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'

const CONNECTION_STRING = process.env.DB_CONNECTION || process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING || 'postgresql://postgres.mhcfzvjbjumopktleguc:@TPfinalIA_10@aws-1-sa-east-1.pooler.supabase.com:5432/postgres'

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/analyze', async (req, res) => {
  try {
    const { product, answers } = req.body || {}
    if (!product) return res.status(400).json({ error: 'El campo "product" es obligatorio' })

    let alternatives = []
    try {
      const q = 'SELECT id, name, price, description FROM products WHERE name ILIKE $1 LIMIT 6'
      const values = [`%${product}%`]
      const db = await pool.query(q, values)
      alternatives = db.rows || []
    } catch (dbErr) {
      console.error('DB error:', dbErr.message)
    }

    const prompt = `Eres AntiShopper, un asistente en español que ayuda a evitar compras impulsivas. El usuario quiere comprar: "${product}".\nRespuestas del usuario: ${JSON.stringify(answers)}.\nAlternativas en catálogo (si las hay): ${alternatives.map(a => a.name).join(', ') || 'ninguna'}.\nRESPONDE SÓLO UN JSON VÁLIDO (sin texto adicional) con esta estructura:\n{\n  "decision": "Comprar" | "No comprar" | "Esperar",\n  "reasons": ["razón 1", "razón 2"],\n  "alternatives": [{"name":"...","price":"...","reason":"por qué es buena alternativa"}]\n}\nTodas las cadenas deben estar en español. No añadas explicaciones fuera del JSON.`

    let recommendationText = null
    try {
      const resp = await axios.post(`${OLLAMA_URL}/api/generate`, {
        model: OLLAMA_MODEL,
        prompt,
        max_tokens: 512,
      })

      let textOut = null
      if (!resp || !resp.data) throw new Error('Respuesta vacía de Ollama')
      if (typeof resp.data === 'string') textOut = resp.data
      else if (resp.data?.text) textOut = resp.data.text
      else if (resp.data?.output) textOut = Array.isArray(resp.data.output) ? resp.data.output.map(o => o.text || o).join('\n') : JSON.stringify(resp.data.output)
      else if (resp.data?.choices && Array.isArray(resp.data.choices)) {
        textOut = resp.data.choices.map(c => {
          if (typeof c === 'string') return c
          if (c?.text) return c.text
          if (c?.message?.content && Array.isArray(c.message.content)) return c.message.content.map(p => p.text || '').join('\n')
          return JSON.stringify(c)
        }).join('\n')
      } else textOut = JSON.stringify(resp.data)

      const jsonMatch = textOut.match(/\{[\s\S]*\}/)
      if (jsonMatch) recommendationText = jsonMatch[0]
      else recommendationText = textOut.trim()
    } catch (err) {
      console.error('Ollama call failed:', err.message)
      return res.status(502).json({ error: 'No se pudo obtener respuesta de la IA. Asegurate de que Ollama esté corriendo localmente.' })
    }

    let parsed = null
    try {
      parsed = JSON.parse(recommendationText)
    } catch (parseErr) {
      console.error('Invalid JSON from AI:', recommendationText, parseErr?.message)
      return res.status(502).json({ error: 'La IA devolvió texto no parseable como JSON. Revisa la configuración del modelo.' })
    }

    res.json({ recommendation: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/chat', async (req, res) => {
  try {
    const { product, messages } = req.body || {}
    if (!product) return res.status(400).json({ error: 'El campo "product" es obligatorio' })

    const history = Array.isArray(messages) ? messages.map(m => `${m.role}: ${m.content}`).join('\n') : ''
    const prompt = `Eres AntiShopper, un entrevistador en español que ayuda a decidir si comprar algo. El usuario quiere comprar: "${product}".\n` + `Historial de conversación:\n${history}\n` + `Ahora: haz UNA sola pregunta corta y relevante para ayudar a decidir, en español, o si ya hay suficiente información devuelve el resultado final como JSON.\n` + `RESPONDE SÓLO UN JSON VÁLIDO (sin texto adicional). Si quieres seguir preguntando, devuelve:\n` + `{"type":"question","question":"Texto de la pregunta en español"}\n` + `Si ya puedes decidir, devuelve:\n` + `{"type":"final","recommendation": {"decision":"Comprar|No comprar|Esperar","reasons":["..."],"alternatives":[{"name":"...","price":"...","reason":"..."}]}}\n` + `Todas las cadenas en español.`

    let textOut = null
    try {
  const resp = await axios.post(`${OLLAMA_URL}/api/generate`, { model: OLLAMA_MODEL, prompt, max_tokens: 512 })
      if (!resp || !resp.data) throw new Error('Respuesta vacía de Ollama')
      if (typeof resp.data === 'string') textOut = resp.data
      else if (resp.data?.text) textOut = resp.data.text
      else if (resp.data?.output) textOut = Array.isArray(resp.data.output) ? resp.data.output.map(o => o.text || o).join('\n') : JSON.stringify(resp.data.output)
      else if (resp.data?.choices && Array.isArray(resp.data.choices)) {
        textOut = resp.data.choices.map(c => {
          if (typeof c === 'string') return c
          if (c?.text) return c.text
          if (c?.message?.content && Array.isArray(c.message.content)) return c.message.content.map(p => p.text || '').join('\n')
          return JSON.stringify(c)
        }).join('\n')
      } else textOut = JSON.stringify(resp.data)
    } catch (err) {
      console.error('Ollama call failed (chat):', err?.message)
      return res.status(502).json({ error: 'No se pudo obtener respuesta de la IA. Asegurate de que Ollama esté corriendo localmente.' })
    }

    const jsonMatch = (textOut || '').match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('AI did not return JSON for chat:', textOut)
      return res.status(502).json({ error: 'La IA no devolvió JSON válido.' })
    }

    let parsed = null
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      console.error('Invalid JSON from AI (chat):', jsonMatch[0], parseErr?.message)
      return res.status(502).json({ error: 'La IA devolvió JSON inválido.' })
    }

    res.json({ result: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/ollama-ps', (req, res) => {
  exec('ollama ps', { windowsHide: true }, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: stderr || error.message })
    res.json({ ps: stdout })
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} — Ollama: ${OLLAMA_URL}`)
})
