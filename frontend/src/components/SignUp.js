import React, { useState } from 'react';
import axios from 'axios';

function SignUp() {
  const [creds, setCreds] = useState({
    email: '',
    password: ''
  });
  return (
    <>
      <h3>Sign-Up</h3>
      <form>
        <label htmlFor="email-signup">Email</label>
        <br />
        <input
          type="text"
          id="email-signup"
          name="email-signup"
          onChange={e =>
            setCreds({ email: e.target.value, password: creds.password })
          }
        />
        <br />
        <label htmlFor="password-signup">Password</label>
        <br />
        <input
          type="password"
          id="password-signup"
          name="password-signup"
          onChange={e =>
            setCreds({ email: creds.email, password: e.target.value })
          }
        />
        <br />
        <input
          type="submit"
          value="Sign-Up"
          onSubmit={console.log(creds)}
        ></input>
      </form>
    </>
  );
}

export default SignUp;
