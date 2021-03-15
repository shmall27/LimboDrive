import React from 'react';
import Login from './Login';
import SignUp from './SignUp';
function Home() {
  return (
    <>
      <h3>Welcome to the beta!</h3>
      <p>Notes:</p>
      <p>Browser Compatibility: Chrome, and Edge (that I know of)</p>
      <p>Style: Coming soon...</p>
      <p>
        Passwords: As this is my very first web app, I would recommend not using
        your banking password.
      </p>
      <p>
        Incognito: I strongly recommend using an incognito window when using
        this software. The File System Access API works much more seamlessly on
        an incognito window (I have no idea why).
      </p>
      <Login />
      <br />
      <SignUp />
    </>
  );
}

export default Home;
