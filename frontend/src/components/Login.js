import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [creds, setCreds] = useState({
    email: '',
    password: '',
  });

  function submitPost() {
    axios
      .post('https://limbo-drive.herokuapp.com/login', {
        creds,
      })
      .then(
        (response) => {
          window.localStorage.setItem('jwt', JSON.stringify(response));
          window.localStorage.setItem('email', creds.email);
          document.getElementById('email-login').value = '';
          document.getElementById('password-login').value = '';
          window.location.href = 'https://limbo-drive.herokuapp.com/rooms';
        },
        (error) => {
          //Handle incorrect creds
          console.log(error);
        }
      );
  }
  return (
    <>
      <h3>Login</h3>
      <form
        onSubmit={(e) => {
          submitPost();
          e.preventDefault();
        }}
      >
        <label htmlFor='email-login'>Email</label>
        <br />
        <input
          type='text'
          id='email-login'
          name='email-login'
          onChange={(e) =>
            setCreds({ email: e.target.value, password: creds.password })
          }
        />
        <br />
        <label htmlFor='password-login'>Password</label>
        <br />
        <input
          type='password'
          id='password-login'
          name='password-login'
          onChange={(e) =>
            setCreds({ email: creds.email, password: e.target.value })
          }
        />
        <br />
        <input type='submit' value='Login'></input>
      </form>
    </>
  );
}

export default Login;
