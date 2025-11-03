import React, { useState } from 'react'
import './Interview.css'

const QUESTIONS = [
  { key: 'need', text: '¿Realmente lo necesitas?' },
  { key: 'haveSimilar', text: '¿Ya tienes algo parecido?' },
  { key: 'budget', text: '¿Cuál es tu presupuesto aproximado? (numero en tu moneda)' },
  { key: 'alternatives', text: '¿Has buscado alternativas más baratas?' },
]

export default function Interview({ onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({})

  const handleChange = (key, value) => setAnswers(a => ({ ...a, [key]: value }))

  const submit = (e) => {
    e.preventDefault()
    onSubmit(answers)
  }

  return (
    <form className="form" onSubmit={submit}>
      <h3>Breve entrevista</h3>
      {QUESTIONS.map(q => (
        <div key={q.key} className="question">
          <label>{q.text}</label>
          {q.key === 'budget' ? (
            <input type="number" value={answers[q.key] || ''} onChange={(e) => handleChange(q.key, e.target.value)} placeholder="Ej: 1500" />
          ) : (
            <div className="radio-group">
              <label><input type="radio" name={q.key} checked={answers[q.key] === true} onChange={() => handleChange(q.key, true)} /> Sí</label>
              <label><input type="radio" name={q.key} checked={answers[q.key] === false} onChange={() => handleChange(q.key, false)} /> No</label>
            </div>
          )}
        </div>
      ))}

      <div className="actions" style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Volver</button>
        <button className="btn btn-primary" type="submit">Analizar</button>
      </div>
    </form>
  )
}
