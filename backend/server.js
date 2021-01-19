const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const Rooms = require('./models/Rooms');
const Users = require('./models/Users');

const connParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const temp_db = mongoose.createConnection(
  'mongodb+srv://Shmall27:xUZ3r0Oo1x@limbodrive.m8zlx.mongodb.net/TempData?retryWrites=true&w=majority',
  connParams
);

const user_db = mongoose.createConnection(
  'mongodb+srv://Shmall27:xUZ3r0Oo1x@limbodrive.m8zlx.mongodb.net/UserData?retryWrites=true&w=majority',
  connParams
);

const DBRooms = temp_db.model('DBRooms', Rooms);

const DBUsers = user_db.model('DBUsers', Users);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const port = 2000;

app.listen(port, () => console.log(`Server running on port ${port}`));

//MIDDLEWARE
//Routes user file tree to mongoDB
app.post('/upload', (req, res) => {
  const dbFiles = new DBRooms({
    name: req.body.fileTree[0].name,
    children: req.body.fileTree[0].children,
    key: req.body.fileTree[0].key
  });

  dbFiles.save(err => {
    if (err) return handleError(err);
  });
});

//Routes file tree from mongoDB back to browser
app.get('/placeholder', (req, res) => {
  DBRooms.find({}, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

app.get('/login', (req, res) => {});

app.post('/signup', (req, res) => {
  console.log(req);
});
