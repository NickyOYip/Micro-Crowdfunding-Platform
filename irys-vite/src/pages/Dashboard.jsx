import { useState, useEffect, useContext } from 'react';
import { DataContext } from '../provider/dataProvider';
import { useNavigate } from 'react-router-dom';
import CampaignCardWrapper from '../components/CampaignCardWrapper';
import useFactory from '../hooks/useFactory';
import { ethers } from 'ethers';

// ABI fragment for the userDonated event
const donationEventAbi = [
  "event userDonated(address indexed user, address indexed campaign)"
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { data } = useContext(DataContext);
  const { ethProvider } = data;
  const { getCampaigns } = useFactory();
  
  const [loading, setLoading] = useState(true);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [fundedCampaigns, setFundedCampaigns] = useState([]);
  const [error, setError] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [noCampaignsCreated, setNoCampaignsCreated] = useState(false);
  const [noCampaignsFunded, setNoCampaignsFunded] = useState(false);

  // Fetch user campaigns and funded campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!ethProvider) {
        setError("Please connect your wallet to view your dashboard");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Get user address
        const signer = await ethProvider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
        
        // Get all campaign addresses
        const allCampaignAddresses = await getCampaigns();
        console.log("All campaigns:", allCampaignAddresses);
        
        // Find campaigns created by the user
        const userCreatedCampaigns = [];
        
        // Process each campaign to find those created by the user
        for (const campaignAddress of allCampaignAddresses) {
          try {
            const contract = new ethers.Contract(
              campaignAddress, 
              ["function owner() view returns (address)"], 
              ethProvider
            );
            
            // Check if campaign is created by user
            const owner = await contract.owner();
            if (owner.toLowerCase() === address.toLowerCase()) {
              userCreatedCampaigns.push(campaignAddress);
            }
          } catch (err) {
            console.error(`Error checking owner for campaign ${campaignAddress}:`, err);
          }
        }
        
        setMyCampaigns(userCreatedCampaigns);
        setNoCampaignsCreated(userCreatedCampaigns.length === 0);
        
        // New approach: Find campaigns funded by user using a global filter on events
        // This is more efficient than checking each campaign individually
        try {
          // Changed 'interface' to 'eventInterface' to avoid using reserved word
          const eventInterface = new ethers.Interface(donationEventAbi);
          
          // Create a filter for the userDonated event where the user is the donor
          // The first indexed parameter is the user address
          const filter = {
            topics: [
              ethers.id("userDonated(address,address)"),
              ethers.zeroPadValue(address, 32) // pad the address to 32 bytes for the filter
            ],
            fromBlock: 0,
            toBlock: 'latest'
          };
          
          // Get all logs matching the filter
          const logs = await ethProvider.getLogs(filter);
          console.log("Donation logs found:", logs);
          
          // Extract unique campaign addresses from the logs
          const fundedAddressesSet = new Set();
          
          for (const log of logs) {
            try {
              // Using the renamed variable here
              const parsedLog = eventInterface.parseLog({
                topics: log.topics,
                data: log.data
              });
              
              if (parsedLog) {
                // The campaign address is the second indexed parameter
                const campaignAddress = parsedLog.args.campaign;
                fundedAddressesSet.add(campaignAddress);
              }
            } catch (err) {
              console.error("Error parsing log:", err);
            }
          }
          
          const userFundedCampaigns = Array.from(fundedAddressesSet);
          setFundedCampaigns(userFundedCampaigns);
          setNoCampaignsFunded(userFundedCampaigns.length === 0);
          
          console.log("Campaigns funded by user:", userFundedCampaigns);
        } catch (err) {
          console.error("Error finding funded campaigns:", err);
          setFundedCampaigns([]);
          setNoCampaignsFunded(true);
        }
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Error loading your campaigns: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [ethProvider, getCampaigns]);

  if (!ethProvider) {
    return (
      <div className="ml-64 p-8 text-white">
        <div className="bg-gray-800 p-8 rounded-xl">
          <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
          <div className="bg-yellow-800/30 text-yellow-100 p-6 rounded-lg text-center">
            <p className="mb-4">Please connect your wallet to view your dashboard</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-yellow-700 hover:bg-yellow-600 py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-8 text-white">
      <div className="bg-gray-800 p-8 rounded-xl">
        <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 text-red-100 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="space-y-10">
            {/* My Created Campaigns */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">My Campaigns</h2>
                <button
                  onClick={() => navigate('/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                >
                  Create New Campaign
                </button>
              </div>
              
              {noCampaignsCreated ? (
                <div className="bg-gray-700/50 p-8 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You haven't created any campaigns yet</p>
                  <button
                    onClick={() => navigate('/create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                  >
                    Create Your First Campaign
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCampaigns.map(address => (
                    <CampaignCardWrapper 
                      key={address} 
                      address={address} 
                      userAddress={userAddress}
                      isOwner={true}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Campaigns I've Funded */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Campaigns I've Funded</h2>
              
              {noCampaignsFunded ? (
                <div className="bg-gray-700/50 p-8 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You haven't backed any campaigns yet</p>
                  <button
                    onClick={() => navigate('/home')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                  >
                    Explore Campaigns
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fundedCampaigns.map(address => (
                    <CampaignCardWrapper 
                      key={`funded-${address}`}
                      address={address}
                      userAddress={userAddress}
                      isDonor={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;