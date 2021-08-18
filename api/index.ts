import express, { Handler } from 'express'
import cors from 'cors'

const app = express()
app.use(express.json())
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://ampirzadeh.github.io'
        : 'http://localhost:3000',
  })
)

const trackData: Record<string, number> = {}
let lastPlayedFile = ''

const returnLastPlayedFile: Handler = (_req, res) => res.json(lastPlayedFile)
const returnSavedProgress: Handler = (req, res) =>
  res.json(trackData[(req.query.trackName || '').toString()] || 0)
const saveProgress: Handler = (req, res) => {
  const trackName = (req.body.trackName || '').toString()
  const trackTime = +(req.body.trackTime || 0)
  trackData[trackName] = trackTime
  lastPlayedFile = trackName

  res.sendStatus(200)
}
app.get('/lastFile', returnLastPlayedFile)
app.route('/progress').get(returnSavedProgress).post(saveProgress)

export default app

if (require.main === module) {
  const port = process.env.PORT || 3001
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`)
  })
}
