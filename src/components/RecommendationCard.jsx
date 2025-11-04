import React from 'react'
import './RecommendationCard.css'

function formatPrice(p) {
  if (p == null) return ''
  const n = Number(p)
  if (!Number.isNaN(n)) return `$${n.toLocaleString('es-AR')}`
  
  return p
}

export default function RecommendationCard({ recommendation, alternatives }) {
  
  const structured = recommendation && typeof recommendation === 'object'
  return (
    <div className="result">
      <h3>Recomendación</h3>
      {structured ? (
        <>
          <p className="recommend-text"><strong>{recommendation.decision}</strong></p>
          {recommendation.reasons && (
            <div>
              <h4>Razones</h4>
              <ul>
                {recommendation.reasons.map((r, i) => <li key={i} className="muted">{r}</li>)}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="recommend-text">{recommendation}</p>
      )}

      {Array.isArray(recommendation?.alternatives) && recommendation.alternatives.length > 0 && (
        <div className="alts">
          <h4>Alternativas del catálogo</h4>
          <ul>
            {recommendation.alternatives.map((a, idx) => (
              <li key={idx}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                  <strong>{a.name}</strong>
                  <span className="price">{a.price ? formatPrice(a.price) : ''}</span>
                </div>
                {a.reason && <div className="muted">{a.reason}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Backwards-compatible alternatives array from server */}
      {!structured && alternatives && alternatives.length > 0 && (
        <div className="alts">
          <h4>Alternativas del catálogo</h4>
          <ul>
            {alternatives.map(a => (
              <li key={a.id}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                  <strong>{a.name}</strong>
                  <span className="price">{a.price ? formatPrice(a.price) : ''}</span>
                </div>
                {a.description && <div className="muted">{a.description}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
