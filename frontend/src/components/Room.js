import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import UploadForm from './UploadForm';
import DirName from './DirName';
import UserInvite from './UserInvite';

import './styles.css';

function Room() {
  const [res, setRes] = useState(null);
  const { dirID } = useParams();
  useEffect(() => {
    if (localStorage.length > 0) {
      axios
        .post('http://localhost:2000/rooms-files/', {
          jwt: JSON.parse(window.localStorage.getItem('jwt')).data,
          dirID
        })
        .then(
          response => {
            setRes(response.data);
          },
          error => {
            console.log(error);
          }
        );
    }
  }, []);
  return (
    <>
      {res && (
        <DirName
          dirID={dirID}
          text={res.dirName}
          onSetText={text => setRes({ dirName: text, fileTree: res.fileTree })}
        />
      )}
      {res && <UploadForm fileTree={res.fileTree} dirID={dirID} />}
      {res && <UserInvite dirID={dirID} />}
    </>
  );
}

export default Room;
