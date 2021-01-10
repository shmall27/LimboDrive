import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileUI from './FileUI';

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
  axios
    .post('http://localhost:2000/upload/files', {
      fileTree: fileTree
    })
    .then(
      response => {
        console.log(response);
      },
      error => {
        console.log(error);
      }
    );
}

function UploadForm() {
  const [res, setRes] = useState(null);
  useEffect(async () => {
    const response = await axios.get('http://localhost:2000/download/files');
    setRes(response);
  }, []);
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
          <input type="submit" id="standard-upload" onClick={createFileTree} />
        </form>
      </div>

      <div id="upload-console">
        {res && <FileUI items={res.data} depth={0} />}
      </div>
    </>
  );
}

export default UploadForm;
