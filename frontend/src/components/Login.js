import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [creds, setCreds] = useState({
    email: '',
    password: ''
  });
  return (
    <>
      <h3>Login</h3>
      <form>
        <label htmlFor="email-login">Email</label>
        <br />
        <input
          type="text"
          id="email-login"
          name="email-login"
          onChange={e =>
            setCreds({ email: e.target.value, password: creds.password })
          }
        />
        <br />
        <label htmlFor="password-login">Password</label>
        <br />
        <input
          type="password"
          id="password-login"
          name="password-login"
          onChange={e =>
            setCreds({ email: creds.email, password: e.target.value })
          }
        />
        <br />
        <input type="submit" value="Login"></input>
      </form>
    </>
  );
}

export default Login;
