import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';
import { DataContext } from "../../src2/provider/dataProvider";
import { WalletContext } from "../../src2/provider/walletProvider";
import * as IrysActions from "../../src2/hooks/irysHook/irysAction";
import { GiTakeMyMoney, GiReceiveMoney } from "react-icons/gi";
import { LuLayoutDashboard } from "react-icons/lu";
import "./sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const { data } = useContext(DataContext);
  // Check if connected to Irys
  const isConnected = data.irysUploader !== null;

  
  return (
    <div className="w-64 bg-gray-900 h-screen p-4 fixed">
      <div className="mb-8">
        <h2 className="text-white text-xl font-bold">Account</h2>
        <p className="text-gray-400 text-sm mt-2 truncate">
          Demo User ({data.owner})
        </p>
      </div>
      <nav className="space-y-4">
        <row className="hover:text-white" style={{ display: "flex" }}>
          <div id="icons" ><GiTakeMyMoney /></div>
          <Link to="/home" className="block  hover:text-white">
            Funding Campaign
          </Link>
        </row>
        <row className="hover:text-white" style={{ display: "flex" }}>
          <div id="icons" ><LuLayoutDashboard /></div>
          <Link to="/dashboard" className="block hover:text-white">
            Dashboard</Link>
        </row>
        <row className="hover:text-white" style={{ display: "flex" }}>
          <div id="icons" > <GiReceiveMoney /> </div>
          <Link to="/create" className="block  hover:text-white">
            Create Campaign</Link>
        </row>
        <button
          onClick={() => navigate('/')} // Add navigation handler
          className="block text-red-500 hover:text-red-400"
        >
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
