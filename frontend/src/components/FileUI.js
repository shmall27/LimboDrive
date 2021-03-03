import React, { useState, useEffect } from 'react';
const io = require('socket.io-client');
let socket;

function FileUI(props) {
  useEffect(() => {
    socket = io('http://localhost:2000');
    socket.emit(
      'userSocket',
      JSON.parse(window.localStorage.getItem('jwt')).data
    );
  }, []);

  const [miniTree, treeSet] = useState();
  if (typeof props.items !== 'undefined') {
    if (props.items.length > 0) {
      return props.items.map(item => {
        if (item.expand === false) {
          return (
            <div key={item.name} className="fileIcon">
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
              <button
                id="downlaod"
                onClick={e => {
                  e.preventDefault();
                  if (item) {
                    console.log(props.host);
                    socket.emit('fileSelect', {
                      path: item.path,
                      host: props.host
                    });
                  }
                }}
              ></button>
            </div>
          );
        } else {
          item.expand = false;
          return (
            <div key={item.name} className="fileIcon">
              <b
                onClick={() => {
                  treeSet(item);
                }}
                style={{ paddingLeft: props.depth * 15 }}
              >
                {item.name}
              </b>
              <FileUI items={miniTree} depth={props.depth + 1} />
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
