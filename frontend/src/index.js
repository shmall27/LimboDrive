import React from "react";
import ReactDOM from "react-dom";
import FileUI from "./components/FileUI";
import axios from 'axios'

// Standard form upload
document
  .getElementById("standard-upload")
  .addEventListener("click", function(e) {
    let standardUploadFiles = document.getElementById("standard-upload-files")
      .files;
    e.preventDefault();

    let fileTree = [];

    let level = { fileTree };

    for (let i = 0; i < standardUploadFiles.length; i++) {
      //Recreate the file tree
      standardUploadFiles[i].webkitRelativePath.split("/").reduce((r, name) => {
        if (!r[name]) {
          r[name] = { fileTree: [] };
          r.fileTree.push({
            name,
            children: r[name].fileTree,
            expand: false,
            key: standardUploadFiles[i].webkitRelativePath,
          });
        }
        return r[name];
      }, level);
    }
    //Send files to express server
    axios.post('http://localhost:2000/upload/files', {
      fileTree: fileTree
    }).then((response) => {
      console.log(response);
    }, (error) => {
      console.log(error);
    });
  });

  axios.get('http://localhost:2000/download/files')
  .then(res => {
    ReactDOM.render(
      <FileUI items={res.data} depth={0} />,
      document.getElementById("upload-list")
    );
  })
  .catch(err => {
    console.log(err)
  })