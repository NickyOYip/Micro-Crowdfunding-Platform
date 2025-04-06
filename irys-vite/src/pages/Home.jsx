import { useState, useEffect, useContext } from 'react';
import { DataContext } from '../provider/dataProvider';
import useFactory from '../hooks/useFactory';
import CampaignCardWrapper from '../components/CampaignCardWrapper';

const Home = () => {
  const { data } = useContext(DataContext);
  const { ethProvider } = data;
  const { getCampaigns } = useFactory();
  
  const [campaignAddresses, setCampaignAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'failed'

  // Fetch all campaign addresses when component mounts
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!ethProvider) {
        setError('Please connect your wallet first');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get all campaign addresses
        const addresses = await getCampaigns();
        console.log("Found campaigns:", addresses);
        setCampaignAddresses(addresses);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        setError(`Error fetching campaigns: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [ethProvider, getCampaigns]);

  return (
    <div className="ml-64 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-white text-3xl">Explore Campaigns</h1>
        
        <div className="flex space-x-2">
          <FilterButton 
            label="All" 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
          />
          <FilterButton 
            label="Active" 
            active={filter === 'active'} 
            onClick={() => setFilter('active')}
          />
          <FilterButton 
            label="Completed" 
            active={filter === 'completed'} 
            onClick={() => setFilter('completed')}
          />
          <FilterButton 
            label="Failed" 
            active={filter === 'failed'} 
            onClick={() => setFilter('failed')}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      ) : campaignAddresses.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="text-xl">No campaigns found</p>
          {!ethProvider ? (
            <p className="mt-2">Connect your wallet to see campaigns</p>
          ) : (
            <p className="mt-2">Be the first to create a campaign!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaignAddresses.map((address) => (
            <CampaignCardWrapper key={address} address={address} filter={filter} />
          ))}
        </div>
      )}
    </div>
  );
};

// Filter button component
const FilterButton = ({ label, active, onClick }) => (
  <button
    className={`px-4 py-2 rounded-lg ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

export default Home;