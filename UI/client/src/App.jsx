import React from "react";
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetails from './pages/CampaignDetails';
import Voting from './pages/Voting';
import Sidebar from './components/Sidebar';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/*" element={
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create" element={<CreateCampaign />} />
              <Route path="/campaign/:id" element={<CampaignDetails />} />
              <Route path="/vote/:id" element={<Voting />} />
            </Routes>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;