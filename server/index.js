import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'
import pkg from 'pg'

dotenv.config()
const { Pool } = pkg

const PORT = process.env.PORT || 4000
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

// Use provided connection string or environment variables
const CONNECTION_STRING = process.env.DB_CONNECTION || process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING ||
  'postgresql://postgres.mhcfzvjbjumopktleguc:@TPfinalIA_10@aws-1-sa-east-1.pooler.supabase.com:5432/postgres'

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  // pooler may require ssl depending on environment; allow override
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Main analyze endpoint: expects { product: string, answers: object }
app.post('/api/analyze', async (req, res) => {
  try {
    const { product, answers } = req.body || {}
    if (!product) return res.status(400).json({ error: 'El campo "product" es obligatorio' })

    // Simple DB query: try to find similar product names
    let alternatives = []
    try {
      const q = 'SELECT id, name, price, description FROM products WHERE name ILIKE $1 LIMIT 6'
      const values = [`%${product}%`]
      const db = await pool.query(q, values)
      alternatives = db.rows || []
    } catch (dbErr) {
      // If DB fails, log and continue with empty alternatives
      console.error('DB error:', dbErr.message)
    }

    // Build a stricter prompt asking for JSON output in Spanish
    const prompt = `Eres AntiShopper, un asistente en español que ayuda a evitar compras impulsivas. El usuario quiere comprar: "${product}".
Respuestas del usuario: ${JSON.stringify(answers)}.
Alternativas en catálogo (si las hay): ${alternatives.map(a => a.name).join(', ') || 'ninguna'}.
RESPONDE SÓLO UN JSON VÁLIDO (sin texto adicional) con esta estructura:
{
  "decision": "Comprar" | "No comprar" | "Esperar",
  "reasons": ["razón 1", "razón 2"],
  "alternatives": [{"name":"...","price":"...","reason":"por qué es buena alternativa"}]
}
Todas las cadenas deben estar en español. No añadas explicaciones fuera del JSON.`

    // Call Ollama (modelo recomendado: 'llama3' o 'llama3-chat' si tu instalación lo provee). Aquí uso 'llama3'.
    let recommendationText = null
    try {
      const resp = await axios.post(`${OLLAMA_URL}/v1/generate`, {
        model: 'llama3',
        prompt,
        max_tokens: 512,
      }, { timeout: 20000 })

      // Extract text from various possible shapes
      let textOut = null
      if (!resp || !resp.data) throw new Error('Respuesta vacía de Ollama')
      if (typeof resp.data === 'string') textOut = resp.data
      else if (resp.data?.text) textOut = resp.data.text
      else if (resp.data?.output) textOut = Array.isArray(resp.data.output) ? resp.data.output.map(o=>o.text||o).join('\n') : JSON.stringify(resp.data.output)
      else textOut = JSON.stringify(resp.data)

      // Try to find JSON inside the returned text
      const jsonMatch = textOut.match(/\{[\s\S]*\}/)
      if (jsonMatch) recommendationText = jsonMatch[0]
      else recommendationText = textOut.trim()
    } catch (err) {
      console.error('Ollama call failed:', err.message)
      return res.status(502).json({ error: 'No se pudo obtener respuesta de la IA. Asegurate de que Ollama esté corriendo localmente.' })
    }

    // Parse JSON - if parsing fails, return 502 so frontend knows IA failed or returned invalid JSON
    let parsed = null
    try {
      parsed = JSON.parse(recommendationText)
    } catch (parseErr) {
      console.error('Invalid JSON from AI:', recommendationText, parseErr?.message)
      return res.status(502).json({ error: 'La IA devolvió texto no parseable como JSON. Revisa la configuración del modelo.' })
    }

    // Ensure fields exist and are in Spanish (best-effort)
    res.json({ recommendation: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} — Ollama: ${OLLAMA_URL}`)
})
