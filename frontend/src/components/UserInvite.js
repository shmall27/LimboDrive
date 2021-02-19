import React, { useState } from 'react';
import axios from 'axios';

function UserInvite(props) {
  const [userInvite, setUserInvite] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (localStorage.length > 0) {
          axios
            .post('http://localhost:2000/invite-user', {
              jwt: JSON.parse(window.localStorage.getItem('jwt')).data,
              userEmail: userInvite,
              dirID: props.dirID
            })
            .then(
              response => {},
              error => {
                console.log(error);
              }
            );
        }
      }}
    >
      <input
        type="text"
        placeholder="Invite via email"
        onChange={e => {
          setUserInvite(e.target.value);
        }}
      />
      <input type="submit" value="Submit" />
    </form>
  );
}
export default UserInvite;
