import React, { useState } from 'react';
import axios from 'axios';

function SignUp() {
  const [creds, setCreds] = useState({
    email: '',
    password: '',
  });

  function submitPost() {
    axios
      .post('https://limbo-drive.herokuapp.com/signup', {
        creds,
      })
      .then(
        (response) => {
          window.localStorage.setItem('jwt', JSON.stringify(response));
          document.getElementById('email-signup').value = '';
          document.getElementById('password-signup').value = '';
          window.location.href = 'https://limbo-drive.herokuapp.com/rooms';
        },
        (error) => {
          console.log(error);
        }
      );
  }
  return (
    <>
      <h3>Sign-Up</h3>
      <form
        onSubmit={(e) => {
          console.log(creds);
          submitPost();
          e.preventDefault();
        }}
      >
        <label htmlFor='email-signup'>Email</label>
        <br />
        <input
          type='text'
          id='email-signup'
          name='email-signup'
          onChange={(e) =>
            setCreds({ email: e.target.value, password: creds.password })
          }
        />
        <br />
        <label htmlFor='password-signup'>Password</label>
        <br />
        <input
          type='password'
          id='password-signup'
          name='password-signup'
          onChange={(e) => {
            setCreds({ email: creds.email, password: e.target.value });
          }}
        />
        <br />
        <input type='submit' value='Sign-Up'></input>
      </form>
    </>
  );
}

export default SignUp;
