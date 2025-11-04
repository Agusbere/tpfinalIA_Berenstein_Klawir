import React, { useState } from 'react'
import Header from '../components/Header'
import ProductForm from '../components/ProductForm'
import Chat from '../components/Chat'
import RecommendationCard from '../components/RecommendationCard'
import './Home.css'

export default function Home() {
  const [stage, setStage] = useState('input')
  const [product, setProduct] = useState('')
  const [result, setResult] = useState(null)

  const startInterview = (prod) => {
    setProduct(prod)
    setStage('interview')
  }

  const cancelInterview = () => {
    setStage('input')
    setProduct('')
  }

  // submitInterview is no longer used because we now use Chat component for the interview flow

  return (
    <div>
      <Header />
      <main className="container main-wrap">
        <div className="card center-square">
          {stage === 'input' && <ProductForm onStart={startInterview} />}
    {stage === 'interview' && <Chat product={product} onCancel={cancelInterview} onComplete={(recommendation) => { setResult({ recommendation }); setStage('result') }} />}
          {stage === 'result' && result && (
            <div>
              <RecommendationCard recommendation={result.recommendation} alternatives={result.alternatives} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => { setStage('input'); setResult(null); setProduct('') }}>Nueva búsqueda</button>
              </div>
            </div>
          )}
          
        </div>
      </main>
    </div>
  )
}
