import React, { useContext } from "react";
import { Route, Routes, Navigate } from 'react-router-dom';
import { DataContext } from './provider/dataProvider';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';
import Sidebar from './components/Sidebar';

const App = () => {
  const { data } = useContext(DataContext);
  const { ethProvider } = data;

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={
          <>
            <Sidebar />
            <Home />
          </>
        } />
        <Route path="/dashboard" element={
          <>
            <Sidebar />
            <Dashboard />
          </>
        } />
        <Route path="/create" element={
          <>
            <Sidebar />
            <CreateCampaign />
          </>
        } />
        <Route path="/campaign/:campaignAddress" element={
          <>
            <Sidebar />
            <CampaignDetail />
          </>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;