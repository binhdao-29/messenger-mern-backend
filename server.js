import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Pusher from 'pusher';

import mongoMessages  from './messageModel.js';

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1180193",
    key: "2a377081bb7dad822621",
    secret: "ff5ad74cd5f7bf99e483",
    cluster: "ap1",
    useTLS: true
  });

//middleware
app.use(express.json())
app.use(cors())

//db config
const mongoURI  = 'mongodb+srv://admin:noaIZGKQpLHNIr62@cluster0.u9wqy.mongodb.net/messengerDB?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.once('open', () => {
    console.log('DB CONNECTED');

    const changeStream = mongoose.connection.collection('messages').watch()
    changeStream.on('change', change => {
        pusher.trigger("messages", "newMessage", {
            'change': change
          });
    })
})
//api route
app.get('/', (req, res) => res.status(200).send('Hello world!'));

app.post('/save/message', (req, res) => {
    const dbMessage = req.body;

    mongoMessages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})

app.get('/retrieve/conversation', (req, res) => {
    mongoMessages.find((err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            data.sort((a, b) => {
                return a.timestamp - b.timestamp;
            })
            res.status(200).send(data);
        }
    })
})

//listen
app.listen(port,() => console.log(`listening on localhost: ${port}`)); 