import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileUI from './FileUI';
import Login from './Login';
import SignUp from './SignUp';
function createFileTree(e) {
  let standardUploadFiles = document.getElementById('standard-upload-files')
    .files;
  e.preventDefault();

  let fileTree = [];

  let level = { fileTree };

  for (let i = 0; i < standardUploadFiles.length; i++) {
    //Recreate the file tree
    standardUploadFiles[i].webkitRelativePath.split('/').reduce((r, name) => {
      if (!r[name]) {
        r[name] = { fileTree: [] };
        r.fileTree.push({
          name,
          children: r[name].fileTree,
          expand: false,
          key: standardUploadFiles[i].webkitRelativePath
        });
      }
      return r[name];
    }, level);
  }
  //Send files to express server
  if (localStorage.length > 0) {
    axios
      .post('http://localhost:2000/upload', {
        fileTree,
        jwt: JSON.parse(window.localStorage.getItem('jwt')).data
      })
      .then(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
      );
  } else console.log('Please sign in.');
}

function UploadForm() {
  const [res, setRes] = useState(null);
  useEffect(async () => {
    if (localStorage.length > 0) {
      axios
        .post('http://localhost:2000/placeholder', {
          jwt: JSON.parse(window.localStorage.getItem('jwt')).data
        })
        .then(
          response => {
            setRes(response);
          },
          error => {
            console.log(error);
          }
        );
    }
  }, []);
  if (!localStorage.length > 0) {
    //This should definitely use Router instead of just calling the component
    //Still gonna push it to GitHub for now though
    return (
      <>
        <div id="intro">
          <h3>LimboDrive...</h3>
          <em>
            is a Web App that utilizes WebRTC to share entire drives of files
            without the need for cloud storage!
          </em>
        </div>
        <br />
        <Login />
        <br />
        <SignUp />
      </>
    );
  } else {
    return (
      <>
        <div id="upload-form">
          <h3>Select files from your computer</h3>
          <form>
            <input
              type="file"
              name="files"
              id="standard-upload-files"
              webkitdirectory="true"
              mozdirectory="true"
            />
            <input
              type="submit"
              id="standard-upload"
              onClick={createFileTree}
            />
          </form>
        </div>

        <div id="upload-console">
          {res && <FileUI items={res.data} depth={0} />}
        </div>
      </>
    );
  }
}

export default UploadForm;
