import express from 'express'
import cors from 'cors'
import downloadRouter from './routes/download'
import mediaRouter from './routes/media'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Register routes
app.use('/api/download', downloadRouter)
app.use('/api/media', mediaRouter)

const port = process.env.PORT ?? 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
