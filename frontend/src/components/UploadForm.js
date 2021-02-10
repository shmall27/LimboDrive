import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import FileUI from './FileUI';

function UploadForm() {
  const [res, setRes] = useState(null);
  const { dirID } = useParams();
  useEffect(async () => {
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
  if (localStorage.length > 0) {
    return (
      <>
        <div id="upload-form">
          <h3>Upload files from your computer!</h3>
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
              onClick={e => {
                let standardUploadFiles = document.getElementById(
                  'standard-upload-files'
                ).files;
                e.preventDefault();

                let fileTree = [];

                let level = { fileTree };

                for (let i = 0; i < standardUploadFiles.length; i++) {
                  //Recreate the file tree
                  standardUploadFiles[i].webkitRelativePath
                    .split('/')
                    .reduce((r, name) => {
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
                      dirID,
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
              }}
            />
          </form>
        </div>

        <div id="upload-console">
          {res && <FileUI items={res.fileTree} depth={0} />}
        </div>
      </>
    );
  } else {
    window.location.href = 'http://localhost:3000/';
  }
}

export default UploadForm;
