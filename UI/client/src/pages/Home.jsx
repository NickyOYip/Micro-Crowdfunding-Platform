import CampaignCard from '../components/CampaignCard';
import { useState } from 'react';

const Home = () => {
  const [campaigns] = useState([{
    id: 1,
    title: "Sample Campaign",
    description: "Sample description",
    status: "Running In Progress",
    image: "https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350"
  }]);

  return (
    <div className="ml-64 p-8">
      <h1 className="text-white text-3xl mb-8">Active Campaigns</h1>
      <div className="grid grid-cols-3 gap-6">
        {campaigns.map((campaign, index) => (
          <CampaignCard key={index} campaign={campaign} />
        ))}
      </div>
    </div>
  );
};
export default Home;