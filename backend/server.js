const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

function verifyToken(req, res, next) {
  const webToken = req.header('web-token');
  if (!webToken) {
    res.status(401).send('Please sign in or create an account.');

    try {
      const verified = jwt.verify(webToken, 'tokenSecretGoesHere');
      req.userExists = verified;
      next();
    } catch {
      res.status(400).send('Invalid token.');
    }
  }
}

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

//Validates user input with mongoDB documents
app.post('/login', async (req, res) => {
  const userExists = await DBUsers.findOne({ email: req.body.creds.email });
  if (userExists) {
    const validatePassword = await bcrypt.compare(
      req.body.creds.password,
      userExists.password
    );
    if (validatePassword) {
      //User is valid at this point
      const webToken = jwt.sign({ id: userExists._id }, 'tokenSecretGoesHere');
      res.header('web-token', webToken).send(webToken);
      console.log('Signed in!');
    } else {
      res.status(401).send('Your email or password is incorrect');
    }
  } else {
    res.status(401).send('Your email or password is incorrect');
  }
});

//Creates mongoDB user document from input fields
app.post('/signup', async (req, res) => {
  const userExists = await DBUsers.findOne({ email: req.body.creds.email });
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(req.body.creds.password, salt);

  if (!userExists) {
    const dbSignUp = new DBUsers({
      email: req.body.creds.email,
      password: hashedPassword
    });

    dbSignUp.save(err => {
      if (err) return handleError(err);
    });
  }
  console.log(
    `Email: ${req.body.creds.email}, Password: ${req.body.creds.password}`
  );
});
