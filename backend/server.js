const express = require('express')
const cors = require('cors')
const app = express()
const mongoose = require('mongoose')
const DBRooms = require('./models/Rooms')

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

//Routes user file tree to mongoDB
app.post('/upload/files', (req, res) => {
    const dbFiles = new DBRooms({
        name: req.body.fileTree[0].name,
        children: req.body.fileTree[0].children,
        key: req.body.fileTree[0].key
      });
      
      dbFiles.save(err => {
        if (err) return handleError(err);
      })
})

//Routes file tree from mongoDB back to browser
app.get('/download/files', (req, res) => {
    DBRooms.find({}, function(err, result) {
        if (err) {
          console.log(err);
        } else {
          res.json(result);
        }
      });
})