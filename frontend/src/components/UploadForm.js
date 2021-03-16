/* eslint-disable eqeqeq */
import React, { useEffect } from 'react';
import axios from 'axios';
import FileUI from './FileUI';
const mime = require('mime-types');

const packetSize = 16 * 1024;
let db;
let indexedDBArr = [];
let queue = [];
let bufferQueue = [];

function treeSearch(tree, search) {
  for (const item of tree) {
    if (item.path == search) {
      return item.handle;
    }
    if (!item.children) continue;
    const result = treeSearch(item.children, search);
    if (result) return result;
  }
  return null;
}

function UploadForm(props) {
  async function hostUploadFile(reqFile, reqSocket, sliceNum, host, path) {
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
        path,
        cone: reqSocket,
        host,
        sliceNum,
      });
    } else {
      props.socket.emit('toServerPacket', {
        cone: reqSocket,
        path,
        msg: 'done',
      });

      for (let i = 0; i < queue.length; i++) {
        if (queue[i].handle == reqSocket) {
          queue.splice(i, 1);
        }
      }
      console.log('Upload Complete!');
    }
  }

  useEffect(() => {
    //Save file to indexedDB
    let request = indexedDB.open('virtualFS');

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      db.createObjectStore('file_tree', {
        keyPath: 'name',
      });
    };

    request.onerror = (e) => {
      console.log('There was an error creating an indexedDB');
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      const tx = db.transaction('file_tree', 'readonly');
      const req = tx.objectStore('file_tree');
      const cursor = req.openCursor();
      cursor.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          indexedDBArr.push(cursor.value);
          cursor.continue();
        }
      };
    };

    props.socket.emit('userSocket', {
      userID: JSON.parse(window.localStorage.getItem('jwt')).data,
      dirID: props.dirID,
    });

    props.socket.on('selectedFile', async (data) => {
      let selectedFile = null;
      if (indexedDBArr.length > 0) {
        //initReqFile is the handle of the file that has been requested
        let found = false;
        if (queue.length > 0) {
          for (let i = 0; i < queue.length; i++) {
            if (queue[i].path == data.path) {
              found = true;
              selectedFile = queue[i].handle;
              break;
            }
          }
        }
        if (!found) {
          selectedFile = treeSearch(indexedDBArr, data.path);
          queue.push({
            path: data.path,
            handle: selectedFile,
          });
        }
        const status = await selectedFile.queryPermission({ mode: 'read' });
        if (status != 'granted') {
          await selectedFile.requestPermission().catch(function (error) {
            console.error(error);
          });
        } else {
          hostUploadFile(
            selectedFile,
            data.cone,
            data.sliceNum,
            data.host,
            data.path
          );
        }
      } else {
        console.log('This file is not in indexedDB');
      }
    });

    props.socket.on('toConePacket', (data) => {
      if (!data.msg) {
        let nextSliceReq = data.sliceNum + 1;
        // Combine buffer arrays into large buffer array
        let found = false;
        if (bufferQueue.length > 0) {
          for (let i = 0; i < bufferQueue.length; i++) {
            if (bufferQueue[i].path == data.path) {
              found = true;
              bufferQueue[i].buffer.push(data.packet);
              break;
            }
          }
        }

        if (!found) {
          bufferQueue.push({
            path: data.path,
            buffer: [data.packet],
          });
        }

        props.socket.emit('toServerRequestDetails', {
          cone: data.cone,
          path: data.path,
          host: data.host,
          sliceNum: nextSliceReq,
        });
      } else {
        if (bufferQueue.length > 0) {
          for (let i = 0; i < bufferQueue.length; i++) {
            if (bufferQueue[i].path === data.path) {
              const file = new Blob(bufferQueue[i].buffer, {
                type: mime.lookup(data.path),
              });
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(file);
              link.download = data.path.match(/[^/]+$/g);
              link.click();
            }
          }
        }
      }
    });

    const prevTime = Date.parse(localStorage.getItem('disTime'));
    const curTime = new Date();
    if (curTime - prevTime > 5000) {
      window.indexedDB.deleteDatabase('virtualFS');
      console.log('Delete database!');

      axios
        .post('http://localhost:2000/delete-tree', {
          jwt: JSON.parse(window.localStorage.getItem('jwt')).data,
        })
        .then(
          (response) => {
            console.log(response);
          },
          (error) => {
            console.log(error);
          }
        );
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
            id='standard-upload'
            onClick={async () => {
              const dirHandle = await window.showDirectoryPicker();
              const fileTree = await fileRecursion(dirHandle, '');

              async function fileRecursion(folder, path) {
                let miniTree = {
                  name: folder.name,
                  handle: folder,
                  expand: false,
                  children: [],
                  path: path + '/' + String(folder.name),
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
                      path: miniTree.path + '/' + String(entry.name),
                    });
                  }
                }
                return miniTree;
              }

              const rx = db.transaction('file_tree', 'readwrite');
              rx.onerror = (e) => console.log(`Error: ${e.target.error}`);
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
                      children: fileTree.children,
                    },
                    jwt: JSON.parse(window.localStorage.getItem('jwt')).data,
                  })
                  .then(
                    (response) => {
                      console.log(response);
                    },
                    (error) => {
                      console.log(error);
                    }
                  );
              } else console.log('Please sign in.');
            }}
          >
            Upload Folders
          </button>
        </div>

        <div id='upload-console'>
          {props.fileTree &&
            props.socket &&
            props.fileTree.map((userUpload) => {
              if (userUpload.fileTree.length > 0) {
                return (
                  <div key={userUpload._id}>
                    <h3>{userUpload.hostEmail}</h3>
                    <FileUI
                      hostEmail={userUpload.hostEmail}
                      items={userUpload.fileTree}
                      dirID={props.dirID}
                      host={userUpload.hostID}
                      depth={0}
                      socket={props.socket}
                    />
                  </div>
                );
              } else {
                return null;
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
