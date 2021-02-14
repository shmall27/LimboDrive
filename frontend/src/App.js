import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import RoomSelection from './components/RoomSelection';
import Room from './components/Room';
import Home from './components/Home';

function App() {
  return (
    <Router>
      <Route path="/" exact component={Home} />
      <Route path="/rooms" exact component={RoomSelection} />
      <Route path="/rooms/:dirID" component={Room} />
    </Router>
  );
}

export default App;
