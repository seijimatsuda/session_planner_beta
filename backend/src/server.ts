import express from 'express'
import cors from 'cors'
import downloadRouter from './routes/download'
import mediaRouter from './routes/media'

const app = express()

// Media-specific CORS - MUST expose Range headers for iOS Safari
app.use('/api/media', cors({
  origin: true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Range', 'Authorization', 'Content-Type'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}))

// Mount media router AFTER its CORS middleware
app.use('/api/media', mediaRouter)

// General CORS for other routes
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Register routes
app.use('/api/download', downloadRouter)

const port = process.env.PORT ?? 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
