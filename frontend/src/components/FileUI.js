import React, { useState } from 'react';
import axios from 'axios';

function deleteFolder(db, folder) {
  const tx = db.transaction('file_tree', 'readwrite');
  tx.oncomplete = (e) => {
    console.log('Database opened.');
  };
  tx.onerror = (e) => {
    console.log(`Error: ${tx.error}`);
  };

  const objectStore = tx.objectStore('file_tree');

  const deleteReq = objectStore.delete(folder);
  deleteReq.onsuccess = (e) => {
    console.log(`${folder} has been deleted`);
  };
}

function FileUI(props) {
  const [miniTree, treeSet] = useState();
  if (typeof props.items !== 'undefined') {
    if (props.items.length > 0) {
      return props.items.map((item) => {
        if (item.expand === false) {
          return (
            <div key={item.name} className='fileIcon'>
              <label
                onClick={() => {
                  if (item.children.length !== 0) {
                    item.expand = !item.expand;
                    treeSet(item.children);
                  }
                }}
                style={{ paddingLeft: props.depth * 15 }}
              >
                {item.name}
              </label>
              {props.hostEmail !== window.localStorage.getItem('email') && (
                <button
                  id='downlaod'
                  onClick={(e) => {
                    e.preventDefault();
                    if (item) {
                      props.socket.emit('fileSelect', {
                        path: item.path,
                        host: props.host,
                        dirID: props.dirID,
                      });
                    }
                  }}
                ></button>
              )}
              {item.path.split('/').length - 1 < 2 &&
                props.hostEmail === window.localStorage.getItem('email') && (
                  <button
                    id='delete'
                    onClick={(e) => {
                      e.preventDefault();
                      axios
                        .post(
                          'https://limbo-drive.herokuapp.com/delete-folder',
                          {
                            jwt: JSON.parse(window.localStorage.getItem('jwt'))
                              .data,
                            path: item.path,
                            dirID: props.dirID,
                          }
                        )
                        .then(
                          (response) => {
                            console.log(response);
                          },
                          (error) => {
                            console.log(error);
                          }
                        );
                      const openDB = indexedDB.open('virtualFS');

                      openDB.onsuccess = (e) => {
                        console.log('DB initialized.');
                        const db = openDB.result;
                        deleteFolder(db, item.name);
                      };
                    }}
                  ></button>
                )}
            </div>
          );
        } else {
          item.expand = false;
          return (
            <div key={item.name} className='fileIcon'>
              <b
                onClick={() => {
                  treeSet(item);
                }}
                style={{ paddingLeft: props.depth * 15 }}
              >
                {item.name}
              </b>
              <FileUI
                items={miniTree}
                socket={props.socket}
                depth={props.depth + 1}
                host={props.host}
              />
            </div>
          );
        }
      });
    } else {
      return <h2>No files uploaded to this drive.</h2>;
    }
  } else if (typeof props.items === 'undefined') {
    return null;
  }
}

export default FileUI;
