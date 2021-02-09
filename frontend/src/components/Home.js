import React from 'react';
import Login from './Login';
import SignUp from './SignUp';
function Home() {
  return (
    <>
      <p>
        LimboDrive allows you to share your files without having to store them
        on 3rd party servers.
      </p>
      <Login />
      <br />
      <SignUp />
    </>
  );
}

export default Home;
