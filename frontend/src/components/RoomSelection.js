import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RoomSelection() {
  const [dirName, setDirName] = useState(null);
  useEffect(async () => {
    if (localStorage.length > 0) {
      axios
        .post('http://localhost:2000/rooms', {
          jwt: JSON.parse(window.localStorage.getItem('jwt')).data
        })
        .then(
          response => {
            setDirName(response.data);
          },
          error => {
            console.log(error);
          }
        );
    }
  }, []);
  if (localStorage.length > 0) {
    return (
      <>
        <h3>Select a room or create a new one!</h3>
        <br />
        <button
          onClick={e => {
            e.preventDefault();
            if (localStorage.length > 0) {
              axios
                .post('http://localhost:2000/room-create', {
                  jwt: JSON.parse(window.localStorage.getItem('jwt')).data
                })
                .then(
                  response => {},
                  error => {
                    console.log(error);
                  }
                );
            }
          }}
          type="button"
        >
          Create a new room!
        </button>
        {dirName &&
          dirName.map(dirs => (
            <p
              onClick={e => {
                if (localStorage.length > 0) {
                  axios
                    .post('http://localhost:2000/room-select', {
                      jwt: JSON.parse(window.localStorage.getItem('jwt')).data,
                      dirID: dirs[1]
                    })
                    .then(
                      response => {
                        window.location.href = `http://localhost:3000/rooms/${dirs[1]}`;
                      },
                      error => {
                        console.log(error);
                      }
                    );
                }
              }}
              key={dirs[1]}
            >
              {dirs[0]}
            </p>
          ))}
      </>
    );
  } else {
    window.location.href = 'http://localhost:3000/';
  }
}

export default RoomSelection;
