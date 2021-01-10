import React, { useState } from 'react';

function FileUI(props) {
  const [miniTree, treeSet] = useState();
  if (typeof props.items !== 'undefined') {
    if (props.items.length > 0) {
      return props.items.map(item => {
        if (item.expand === false) {
          return (
            <div key={item.key} className="fileIcon">
              <p
                onClick={() => {
                  if (item.children.length !== 0) {
                    item.expand = !item.expand;
                    treeSet(item.children);
                  } else {
                    console.log(item.name);
                  }
                }}
                style={{ paddingLeft: props.depth * 15 }}
              >
                {item.name}
              </p>
            </div>
          );
        } else {
          item.expand = false;
          return (
            <div key={item.key} className="fileIcon">
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
