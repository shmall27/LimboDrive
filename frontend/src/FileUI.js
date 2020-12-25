import React, {useEffect, useState} from 'react'
import axios from 'axios'

function FileUI(props) {
  const [miniTree, treeSet] = useState();

  // useEffect(() => {
  //   //Need to write API to handle this... to Express!
  //   axios.get("URL_HERE")
  //   .then(res => {
  //     console.log(res)
  //   })
  //   .catch(err => {
  //     console.log(err)
  //   })
  // })
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
                console.log(item.data);
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
}

export default FileUI;