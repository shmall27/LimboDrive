import React, { useState } from 'react';
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
