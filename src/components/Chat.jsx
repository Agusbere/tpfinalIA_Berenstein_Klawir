import React, { useEffect, useState } from 'react'
import './Chat.css'
import { chat as chatApi } from '../utils/api'

export default function Chat({ product, onCancel, onComplete }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const start = async () => {
      setLoading(true)
      setError(null)
      try {
        const resp = await chatApi(product, [])
        if (!mounted) return
        const r = resp.result
        if (r?.type === 'question') {
          setMessages([{ sender: 'ai', text: r.question }])
        } else if (r?.type === 'final') {
          onComplete(r.recommendation)
        } else {
          setError('Respuesta inesperada de la IA')
        }
      } catch (err) {
        console.error(err)
        setError(err?.response?.data?.error || 'Error al conectar con la IA')
      } finally {
        setLoading(false)
      }
    }
    start()
    return () => { mounted = false }
  }, [product, onComplete])

  const send = async () => {
    if (!input.trim()) return
    const text = input.trim()
    const newMessages = [...messages, { sender: 'user', text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)
    try {
      const apiMessages = newMessages.map(m => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text }))
      const resp = await chatApi(product, apiMessages)
      const r = resp.result
      if (r?.type === 'question') {
        setMessages(prev => [...prev, { sender: 'ai', text: r.question }])
      } else if (r?.type === 'final') {
        onComplete(r.recommendation)
      } else {
        setError('La IA devolvió una respuesta desconocida')
      }
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || 'Error al conectar con la IA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-root">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>{m.text}</div>
        ))}
        {loading && <div className="muted">Procesando…</div>}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="chat-actions">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe tu respuesta aquí..." onKeyDown={e => { if (e.key === 'Enter') send() }} />
        <div className="chat-buttons">
          <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" type="button" onClick={send}>Enviar</button>
        </div>
      </div>
    </div>
  )
}
