import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import UploadForm from './UploadForm';
import DirName from './DirName';
import UserInvite from './UserInvite';

import './styles.css';

const io = require('socket.io-client');
const socket = io('http://localhost:2000');

function Room() {
  const [dirName, setDirName] = useState(null);
  const [userFiles, setUserFiles] = useState(null);
  const { dirID } = useParams();

  socket.on('Update', (data) => {
    setDirName(data.dirName);
    setUserFiles(data.userFiles);
  });

  useEffect(() => {
    if (localStorage.length > 0) {
      axios
        .post('http://localhost:2000/rooms-files/', {
          jwt: JSON.parse(window.localStorage.getItem('jwt')).data,
          dirID,
        })
        .then(
          (response) => {
            setDirName(response.data.dirName);
            setUserFiles(response.data.userFiles);
          },
          (error) => {
            console.log(error);
          }
        );
    }
  }, []);
  return (
    <>
      {dirName && userFiles && (
        <DirName
          dirID={dirID}
          text={dirName}
          onSetText={(text) => setDirName(text)}
        />
      )}
      {dirName && userFiles && (
        <UploadForm fileTree={userFiles} dirID={dirID} socket={socket} />
      )}
      {dirName && userFiles && <UserInvite dirID={dirID} />}
    </>
  );
}

export default Room;
