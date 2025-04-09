import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import BiltyCreator from './components/BiltyCreator';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={AdminDashboard} />
        <Route path="/create-bilty" component={BiltyCreator} />
        {/* Add more routes as needed */}
      </Switch>
    </Router>
  );
}

export default App;
