const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
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

//Socket.io Middleware
io.on('start', socket => {
  socket.on('fileSelect', data => {
    console.log(data);
  });
});

//Express Middleware
//Routes user file tree to mongoDB
app.post('/upload', (req, res) => {
  const webToken = req.body.jwt;
  const dirID = req.body.dirID;
  if (!webToken) {
    res.status(401).send('Access Denied');
  } else {
    try {
      jwt.verify(webToken, 'tokenSecretGoesHere');

      let fileTreeObj = {
        name: req.body.fileTree[0].name,
        children: req.body.fileTree[0].children,
        key: req.body.fileTree[0].key
      };
      DBRooms.findOneAndUpdate(
        { _id: dirID },
        { $push: { fileTree: fileTreeObj } },
        (err, res) => {
          if (err) {
            console.log(err);
          } else {
            // console.log(res);
          }
        },
        { useFindAndModify: false }
      );
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
});

//Routes file tree from mongoDB back to browser
app.post('/rooms-files', (req, res) => {
  const webToken = req.body.jwt;
  const dirID = req.body.dirID;
  if (!webToken) {
    res.status(401).send('Access Denied');
  } else {
    try {
      jwt.verify(webToken, 'tokenSecretGoesHere');
      DBRooms.find({ _id: dirID }, function(err, result) {
        if (err) {
          console.log(err);
        } else {
          res.send(result[0]);
        }
      });
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
});

//Get all rooms that the user is authorized to view
app.post('/rooms', async (req, res) => {
  let dirList = [];
  const webToken = req.body.jwt;
  if (!webToken) {
    res.status(401).send('Access Denied');
  } else {
    try {
      const userDocs = await DBRooms.find({
        authUsers: `${jwt.verify(webToken, 'tokenSecretGoesHere').id}`
      }).exec();
      for (let i = 0; i < userDocs.length; i++) {
        dirList.push([userDocs[i].dirName, userDocs[i]._id]);
      }
      res.send(dirList);
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
});

//Create a new directory room
app.post('/room-create', async (req, res) => {
  const webToken = req.body.jwt;
  if (!webToken) {
    res.status(401).send('Access Denied!');
  } else {
    try {
      jwt.verify(webToken, 'tokenSecretGoesHere');
      new DBRooms({
        authUsers: jwt.verify(webToken, 'tokenSecretGoesHere').id,
        dirName: 'untitled'
      }).save(err => {
        console.log(err);
      });
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
});

//Verify this route with JWT
app.post('/room-select', (req, res) => {
  const webToken = req.body.jwt;
  if (!webToken) {
    res.status(401).send('Access Denied!');
  } else {
    try {
      jwt.verify(webToken, 'tokenSecretGoesHere');
      res.send('Authenticated');
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
});

app.post('/update-name', (req, res) => {
  const webToken = req.body.jwt;
  const dirID = req.body.dirID;
  const dirName = req.body.dirName;
  if (!webToken) {
    res.status(401).send('Access Denied!');
  } else {
    try {
      jwt.verify(webToken, 'tokenSecretGoesHere');
      DBRooms.findOneAndUpdate(
        {
          _id: dirID,
          authUsers: jwt.verify(webToken, 'tokenSecretGoesHere').id
        },
        { dirName: dirName },
        (err, res) => {
          if (err) {
            console.log(err);
          } else {
            // console.log(res);
          }
        },
        { useFindAndModify: false }
      );
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
});

app.post('/invite-user', async (req, res) => {
  const webToken = req.body.jwt;
  const dirID = req.body.dirID;
  const invitedUser = req.body.userEmail;

  if (!webToken) {
    res.status(401).send('Access Denied!');
  } else {
    try {
      jwt.verify(webToken, 'tokenSecretGoesHere');
      let checkEmail = await DBUsers.findOne({ email: invitedUser });
      DBRooms.findOneAndUpdate(
        {
          _id: dirID,
          authUsers: jwt.verify(webToken, 'tokenSecretGoesHere').id
        },
        { $push: { authUsers: checkEmail._id } },
        (err, res) => {
          if (err) {
            console.log(err);
          } else {
            // console.log(res);
          }
        },
        { useFindAndModify: false }
      );
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
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

const port = 2000;
server.listen(port, () => console.log(`Server running on port ${port}`));
