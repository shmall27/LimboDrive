import React from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import FileUI from './FileUI';

function UploadForm(props) {
  let fileBufferArr = [];
  if (localStorage.length > 0) {
    return (
      <>
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

              console.log(standardUploadFiles);

              for (let i = 0; i < standardUploadFiles.length; i++) {
                console.log(standardUploadFiles[i]);
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
                        path: standardUploadFiles[i].webkitRelativePath
                      });
                    }
                    return r[name];
                  }, level);
              }

              //Send files to express server
              if (localStorage.length > 0) {
                axios
                  .post('http://localhost:2000/upload', {
                    dirID: props.dirID,
                    fileTree: {
                      name: fileTree[0].name,
                      children: fileTree[0].children,
                      path: fileTree[0].path
                    },
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

        <div id="upload-console">
          {props.fileTree &&
            props.fileTree.map(userUpload => {
              console.log(userUpload);
              return (
                <div key={userUpload._id}>
                  <h3>{userUpload.hostEmail}</h3>
                  <FileUI items={userUpload.fileTree} depth={0} />
                </div>
              );
            })}
        </div>
      </>
    );
  } else {
    window.location.href = 'http://localhost:3000/';
  }
}

export default UploadForm;
