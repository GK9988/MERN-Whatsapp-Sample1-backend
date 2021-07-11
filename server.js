// Importing
import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from "cors"

// app config
dotenv.config()
const app = express()
const port = process.env.PORT || 3000

const pusher = new Pusher({
  appId: "1234050",
  key: `${process.env.PUSHER_KEY}`,
  secret: `${process.env.PUSHER_SECRET}`,
  cluster: "ap2",
  useTLS: true
});

// middlewares

app.use(express.json())

app.use(cors())

// DB config

const dbConnectionUrl = `mongodb+srv://garv-admin:${process.env.DB_PASSWORD}@cluster0.r1brf.mongodb.net/mern-whatsapp-db?retryWrites=true&w=majority`

mongoose.connect(dbConnectionUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', () => {
  // console.log("db connected");
  const msgCollection = db.collection('messagecontents')
  const changeStream = msgCollection.watch()

  changeStream.on('change', (change) => {
    // console.log(change);
    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument
      pusher.trigger('messages', 'inserted', {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received
      })
    } else {
      console.log("Error triggering pusher");
    }
  })
})

// API routes
app.get('/', (req, res) => {
  res.status(200).send('Hello World!')
})



app.get('/messages/sync' ,(req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(200).send(data)
    }
  })
})

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body 

  Messages.create(dbMessage, (err, data) => {
    if(err){
      res.status(500).send(err)
    } else {
      res.status(201).send(data)
    }
  })
})

// Listeners 
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})