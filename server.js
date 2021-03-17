const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const httpServer = require('http').createServer(app);

const path = require('path');

require('dotenv').config();

const Rooms = require('./models/Rooms');
const Users = require('./models/Users');

httpServer.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);

const connParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const temp_db = mongoose.createConnection(
  String(process.env.TEMP_DB_STRING),
  connParams
);

const user_db = mongoose.createConnection(
  String(process.env.USER_DB_STRING),
  connParams
);

const DBRooms = temp_db.model('DBRooms', Rooms);

const DBUsers = user_db.model('DBUsers', Users);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Web App Running');
  });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const io = require('socket.io')(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

//Socket.io Middleware
let userSocketIDs = [];

io.on('connection', (socket) => {
  socket.on('userSocket', (data) => {
    let userID = jwt.verify(data.userID, process.env.JWT_TOKEN_SECRET).id;
    let found = false;
    if (userSocketIDs.length > 0) {
      for (let i = 0; i < userSocketIDs.length; i++) {
        if (userSocketIDs[i].userID == userID) {
          found = true;
          if (userSocketIDs[i].socketID != socket.id) {
            userSocketIDs[i].socketID = socket.id;
            userSocketIDs[i].disconnected = false;
          }
          if (userSocketIDs[i].dirID != data.dirID) {
            userSocketIDs[i].dirID = data.dirID;
          }
          break;
        }
      }
    }
    if (!found) {
      userSocketIDs.push({
        userID,
        socketID: socket.id,
        dirID: data.dirID,
        disconnected: false,
      });
    }
  });

  socket.on('disconnect', (reason) => {
    for (let i = 0; i < userSocketIDs.length; i++) {
      if (userSocketIDs[i].socketID == socket.id) {
        userSocketIDs[i].disconnected = true;
        setTimeout(async () => {
          if (userSocketIDs[i].disconnected == true) {
            console.log('disconnected');
            await DBRooms.update(
              {},
              { $pull: { userFiles: { hostID: userSocketIDs[i].userID } } }
            );
            userSocketIDs.splice(i, 1);
          }
        }, 5000);
      }
    }
  });

  socket.on('fileSelect', (data) => {
    let hostSocket;
    let reqSocket = socket.id;
    userSocketIDs.map((idPairs) => {
      if (idPairs.userID == data.host) {
        hostSocket = idPairs.socketID;
      }
    });
    if (hostSocket != reqSocket) {
      io.to(hostSocket).emit('selectedFile', {
        path: data.path,
        host: hostSocket,
        cone: reqSocket,
        dirID: data.dirID,
        sliceNum: 1,
      });
    }
  });

  socket.on('toServerPacket', (data) => {
    if (!data.msg) {
      io.to(data.cone).emit('toConePacket', {
        packet: data.packet,
        cone: data.cone,
        path: data.path,
        host: data.host,
        sliceNum: data.sliceNum,
      });
    } else {
      io.to(data.cone).emit('toConePacket', {
        msg: data.msg,
        path: data.path,
      });
    }
  });

  socket.on('toServerRequestDetails', (data) => {
    io.to(data.host).emit('selectedFile', {
      path: data.path,
      cone: data.cone,
      host: data.host,
      sliceNum: data.sliceNum,
    });
  });
});

//Emits changes so rooms don't need to refresh
DBRooms.watch().on('change', async (change) => {
  const updatedDocID = change.documentKey._id;
  const updatedDoc = await DBRooms.findById(updatedDocID).exec();
  console.log(updatedDoc);
  for (const user of updatedDoc.authUsers) {
    for (let i = 0; i < userSocketIDs.length; i++) {
      if (
        userSocketIDs[i].userID == user &&
        userSocketIDs[i].dirID == updatedDocID
      ) {
        found = true;
        io.to(userSocketIDs[i].socketID).emit('Update', {
          dirName: updatedDoc.dirName,
          userFiles: updatedDoc.userFiles,
        });
        break;
      }
    }
  }
});

//Express Middleware
//Routes user file tree to mongoDB
app.post('/upload', async (req, res) => {
  const webToken = req.body.jwt;
  const dirID = req.body.dirID;
  if (!webToken) {
    res.status(401).send('Access Denied');
  } else {
    try {
      const hostID = await jwt.verify(webToken, process.env.JWT_TOKEN_SECRET)
        .id;
      const host = await DBUsers.findById(hostID).exec();
      const fileTreeObj = {
        name: req.body.fileTree.name,
        path: req.body.fileTree.path,
        children: req.body.fileTree.children,
      };

      //Check to see if the user has already uploaded files before
      const userHasUploaded = await DBRooms.findOne({
        _id: dirID,
        'userFiles.hostEmail': host.email,
      });

      //If they have uploaded before, push their new upload to their previous fileTree
      if (userHasUploaded != null) {
        DBRooms.findOneAndUpdate(
          {
            _id: dirID,
            'userFiles.hostEmail': host.email,
          },
          { $push: { 'userFiles.$.fileTree': fileTreeObj } },
          (err, res) => {
            if (err) {
              console.log(err);
            } else {
              // console.log(res);
            }
          },
          { useFindAndModify: false }
        );
      } else {
        //If they haven't uploaded before, create a new instance of their fileTree
        DBRooms.findOneAndUpdate(
          { _id: dirID },
          {
            $push: {
              userFiles: {
                hostEmail: host.email,
                hostID: host._id,
                fileTree: fileTreeObj,
              },
            },
          },
          (err, res) => {
            if (err) {
              console.log(err);
            } else {
              // console.log(res);
            }
          },
          { useFindAndModify: false }
        );
      }
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
});

app.post('/delete-tree', async (req, res) => {
  console.log('Deleted');
  const webToken = req.body.jwt;
  if (!webToken) {
    res.status(401).send('Access Denied');
  } else {
    try {
      const hostID = jwt.verify(webToken, process.env.JWT_TOKEN_SECRET).id;
      console.log(hostID);
      await DBRooms.update({}, { $pull: { userFiles: { hostID } } });
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }
});

app.post('/delete-folder', async (req, res) => {
  const webToken = req.body.jwt;
  const deletedFolder = req.body.path;
  const dirID = req.body.dirID;
  if (!webToken) {
    res.status(401).send('Access Denied');
  } else {
    try {
      const hostID = jwt.verify(webToken, process.env.JWT_TOKEN_SECRET).id;
      DBRooms.findOneAndUpdate(
        {
          _id: dirID,
          'userFiles.hostID': hostID,
        },
        { $pull: { 'userFiles.$.fileTree': { path: deletedFolder } } },
        (err, res) => {
          if (err) {
            console.log(err);
          } else {
            console.log(res);
          }
        },
        { useFindAndModify: false }
      );
    } catch (err) {
      console.log(err);
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
      jwt.verify(webToken, process.env.JWT_TOKEN_SECRET);
      DBRooms.find({ _id: dirID }, function (err, result) {
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
        authUsers: `${jwt.verify(webToken, process.env.JWT_TOKEN_SECRET).id}`,
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
      jwt.verify(webToken, process.env.JWT_TOKEN_SECRET);
      new DBRooms({
        authUsers: jwt.verify(webToken, process.env.JWT_TOKEN_SECRET).id,
        dirName: 'untitled',
      }).save((err) => {
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
      jwt.verify(webToken, process.env.JWT_TOKEN_SECRET);
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
      jwt.verify(webToken, process.env.JWT_TOKEN_SECRET);
      DBRooms.findOneAndUpdate(
        {
          _id: dirID,
          authUsers: jwt.verify(webToken, process.env.JWT_TOKEN_SECRET).id,
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
      const userID = jwt.verify(webToken, process.env.JWT_TOKEN_SECRET).id;
      const checkEmail = await DBUsers.findOne({ email: invitedUser });
      const userAlreadyInvited = await DBRooms.findOne({
        authUsers: checkEmail._id,
      });
      if (userAlreadyInvited == null && checkEmail != null) {
        DBRooms.findOneAndUpdate(
          {
            _id: dirID,
            authUsers: userID,
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
      }
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
      const webToken = jwt.sign(
        { id: userExists._id },
        process.env.JWT_TOKEN_SECRET
      );
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
      password: hashedPassword,
    });

    dbSignUp.save((err) => {
      if (err) {
        return handleError(err);
      }
    });
    const webToken = jwt.sign(
      { id: dbSignUp._id },
      process.env.JWT_TOKEN_SECRET
    );
    res.header('web-token', webToken).send(webToken);
  }
  console.log(
    `Email: ${req.body.creds.email}, Password: ${req.body.creds.password}`
  );
});
