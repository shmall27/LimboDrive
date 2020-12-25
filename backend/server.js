const express = require('express')
const cors = require('cors')
const app = express()
const mongoose = require('mongoose')

mongoose.connect(
'mongodb+srv://Shmall27:xUZ3r0Oo1x@limbodrive.m8zlx.mongodb.net/TempData?retryWrites=true&w=majority',
{
    useNewUrlParser: true,
    useUnifiedTopology: true
},
() => {
    console.log("Connected to TempData DB!")
})


app.use(cors())
app.use(express.json({limit: '50mb'}))

const port = 2000;

app.listen(port, () => console.log(`Server running on port ${port}`))

app.post('/upload', (req, res) => {
    console.log(req.body.fileTree)
})