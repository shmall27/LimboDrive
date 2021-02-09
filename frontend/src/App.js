import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import UploadForm from './components/UploadForm';
import Room from './components/Room';
import Home from './components/Home';

function App() {
  return (
    <Router>
      <Route path="/" exact component={Home} />
      <Route path="/rooms" exact component={Room} />
      <Route path="/rooms/:dirID" component={UploadForm} />
    </Router>
  );
}

export default App;
