import React from "react";
import ReactDOM from "react-dom";
import FileUI from "./FileUI";
let fileTree = [];
// Standard form upload
document
  .getElementById("standard-upload")
  .addEventListener("click", function(e) {
    let standardUploadFiles = document.getElementById("standard-upload-files")
      .files;
    e.preventDefault();

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
            data: standardUploadFiles[i]
          });
        }
        return r[name];
      }, level);
    }
    //Render the file tree component
    ReactDOM.render(
      <FileUI items={fileTree} depth={0} />,
      document.getElementById("upload-list")
    );
  });
