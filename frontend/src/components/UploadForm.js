/* eslint-disable eqeqeq */
import React, { useEffect } from 'react';
import axios from 'axios';
import FileUI from './FileUI';

const packetSize = 16 * 1024;
let initReqFile;

function treeRecursion(tree, search) {
  for (const item of tree) {
    if (item.path == search) {
      return item.handle;
    }
    if (!item.children) continue;
    const result = treeRecursion(item.children, search);
    if (result) return result;
  }
  return null;
}

let db;
let indexedDBArr = [];

function UploadForm(props) {
  async function hostUploadFile(reqFile, reqSocket, sliceNum, host) {
    const file = await reqFile.getFile();
    let fullFile = await file.arrayBuffer();
    fullFile = new Uint8Array(fullFile);
    const percentComplete =
      ((sliceNum * packetSize) / fullFile.byteLength) * 100;
    console.log(percentComplete);

    if ((sliceNum - 1) * packetSize <= fullFile.byteLength) {
      const packet = fullFile.slice(
        (sliceNum - 1) * packetSize,
        sliceNum * packetSize
      );
      props.socket.emit('toServerPacket', {
        packet,
        cone: reqSocket,
        host,
        sliceNum
      });
    } else {
      props.socket.emit('toServerUploadEnd', reqSocket);
      initReqFile = null;
      console.log('Upload Complete!');
    }
  }

  useEffect(() => {
    //Save file to indexDB
    let request = indexedDB.open('virtualFS');

    request.onupgradeneeded = e => {
      db = e.target.result;
      db.createObjectStore('file_tree', {
        keyPath: 'name'
      });
    };

    request.onerror = e => {
      console.log('There was an error creating an indexedDB');
    };

    request.onsuccess = e => {
      indexedDBArr = [];
      db = e.target.result;

      const tx = db.transaction('file_tree', 'readonly');
      const req = tx.objectStore('file_tree');
      const cursor = req.openCursor();

      cursor.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
          indexedDBArr.push(cursor.value);
          console.log(cursor.value);
          cursor.continue();
        }
      };
    };

    props.socket.emit('userSocket', {
      userID: JSON.parse(window.localStorage.getItem('jwt')).data,
      dirID: props.dirID
    });

    props.socket.on('selectedFile', async data => {
      if (indexedDBArr.length > 0) {
        if (!initReqFile) {
          initReqFile = treeRecursion(indexedDBArr, data.path);
        }
        const status = await initReqFile.queryPermission({ mode: 'read' });
        if (status != 'granted') {
          await initReqFile.requestPermission().catch(function(error) {
            console.error(error);
          });
        } else {
          hostUploadFile(initReqFile, data.cone, data.sliceNum, data.host);
        }
      } else {
        console.log('This file is not accessible');
      }
    });

    props.socket.on('toConePacket', data => {
      let nextSliceReq = data.sliceNum + 1;
      //Combine buffer arrays into large buffer array
      console.log(data.packet);
      props.socket.emit('toServerRequestDetails', {
        cone: data.cone,
        host: data.host,
        sliceNum: nextSliceReq
      });
    });

    const prevTime = Date.parse(localStorage.getItem('disTime'));
    const curTime = new Date();
    if (curTime - prevTime > 5000) {
      window.indexedDB.deleteDatabase('virtualFS');
      console.log('im running');
    }
  }, []);

  window.onbeforeunload = () => {
    localStorage.setItem('disTime', new Date());
  };

  if (localStorage.length > 0) {
    return (
      <>
        <div>
          <button
            id="standard-upload"
            onClick={async () => {
              const dirHandle = await window.showDirectoryPicker();
              const fileTree = await fileRecursion(dirHandle, '');

              async function fileRecursion(folder, path) {
                let miniTree = {
                  name: folder.name,
                  handle: folder,
                  expand: false,
                  children: [],
                  path: path + '/' + String(folder.name)
                };
                for await (const entry of folder.values()) {
                  if (entry.kind == 'directory') {
                    miniTree['children'].push(
                      await fileRecursion(entry, miniTree.path)
                    );
                  } else {
                    miniTree['children'].push({
                      name: entry.name,
                      handle: entry,
                      expand: false,
                      children: [],
                      path: miniTree.path + '/' + String(entry.name)
                    });
                  }
                }
                return miniTree;
              }

              const rx = db.transaction('file_tree', 'readwrite');
              rx.onerror = e => console.log(`Error: ${e.target.error}`);
              rx.objectStore('file_tree').add(fileTree);
              indexedDBArr.push(fileTree);

              //Send files to express server
              if (localStorage.length > 0) {
                axios
                  .post('http://localhost:2000/upload', {
                    dirID: props.dirID,
                    fileTree: {
                      name: fileTree.name,
                      path: fileTree.path,
                      children: fileTree.children
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
          >
            Upload Folders
          </button>
        </div>

        <div id="upload-console">
          {props.fileTree &&
            props.socket &&
            props.fileTree.map(userUpload => {
              if (userUpload.fileTree.length > 0) {
                return (
                  <div key={userUpload._id}>
                    <h3>{userUpload.hostEmail}</h3>
                    <FileUI
                      items={userUpload.fileTree}
                      dirID={props.dirID}
                      host={userUpload.hostID}
                      depth={0}
                      socket={props.socket}
                    />
                  </div>
                );
              } else {
                return <h2>No files uploaded to this drive.</h2>;
              }
            })}
        </div>
      </>
    );
  } else {
    window.location.href = 'http://localhost:3000/';
  }
}

export default UploadForm;
