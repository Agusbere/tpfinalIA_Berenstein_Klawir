const url = 'http://localhost:4000/api/health'

(async () => {
  try {
    const res = await fetch(url)
    const txt = await res.text()
    console.log(txt)
  } catch (e) {
    console.error('ERR', e.message)
  }
})()
