import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

const port = process.env.PORT ?? 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
