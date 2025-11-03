import React, { useState } from 'react'
import './ProductForm.css'

export default function ProductForm({ onStart }) {
  const [product, setProduct] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!product.trim()) return
    onStart(product.trim())
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>¿Qué producto quieres comprar?</label>
      <input
        aria-label="product"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        placeholder="Ej: Auriculares inalámbricos"
      />
      <div>
        <button className="btn btn-primary" type="submit">Comenzar entrevista</button>
      </div>
    </form>
  )
}
