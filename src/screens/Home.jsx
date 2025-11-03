import React, { useState } from 'react'
import Header from '../components/Header'
import ProductForm from '../components/ProductForm'
import Interview from '../components/Interview'
import RecommendationCard from '../components/RecommendationCard'
import { analyze } from '../utils/api'
import './Home.css'

export default function Home() {
  const [stage, setStage] = useState('input') // input, interview, result
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const startInterview = (prod) => {
    setProduct(prod)
    setStage('interview')
  }

  const cancelInterview = () => {
    setStage('input')
    setProduct('')
  }

  const submitInterview = async (answers) => {
    setLoading(true)
    try {
      const data = await analyze(product, answers)
      setResult(data)
      setStage('result')
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error al analizar. Revisa la consola del server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header />
      <main className="container main-wrap">
        <div className="card center-square">
          {stage === 'input' && <ProductForm onStart={startInterview} />}
          {stage === 'interview' && <Interview onSubmit={submitInterview} onCancel={cancelInterview} />}
          {stage === 'result' && result && (
            <div>
              <RecommendationCard recommendation={result.recommendation} alternatives={result.alternatives} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => { setStage('input'); setResult(null); setProduct('') }}>Nueva búsqueda</button>
              </div>
            </div>
          )}
          {loading && <div className="loading">Analizando…</div>}
        </div>
      </main>
    </div>
  )
}
