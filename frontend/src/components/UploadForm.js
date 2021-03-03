import React, { useEffect } from 'react';
import axios from 'axios';
import FileUI from './FileUI';

function UploadForm(props) {
  console.log(props);
  let db;
  useEffect(() => {
    //IndexDB implementation
    if (!window.indexedDB) {
      console.log(
        "Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."
      );
    } else {
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
        db = e.target.result;
        const tx = db.transaction('file_tree', 'readonly');
        const req = tx.objectStore('file_tree').openCursor();

        req.onsuccess = e => {
          const cursor = e.target.result;
          if (cursor) {
            console.log(cursor.value);
            cursor.continue();
          }
        };
      };
    }
  }, []);

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

              console.log(fileTree);
              //Save file to indexDB
              const rx = db.transaction('file_tree', 'readwrite');
              rx.onerror = e => console.log(`Error: ${e.target.error}`);
              rx.objectStore('file_tree').add(fileTree);

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
            props.fileTree.map(userUpload => {
              return (
                <div key={userUpload._id}>
                  <h3>{userUpload.hostEmail}</h3>
                  <FileUI
                    items={userUpload.fileTree}
                    host={userUpload.hostID}
                    depth={0}
                  />
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
