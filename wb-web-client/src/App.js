import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import './legacy/css/jquery-ui.min.css';
import './legacy/css/main.css';
import './legacy/js/jquery-1.9.1.min.js';
import './legacy/js/jquery-ui-1.10.1.custom.min.js';
import './legacy/js/wormbase.js';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
