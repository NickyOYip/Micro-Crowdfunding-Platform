import CampaignCard from '../components/CampaignCard';
import { useState } from 'react';
import MyCards from '../components/MyCards';
//Show my campaigns and campaigns I funded 

const Dashboard = () => {
  const [campaigns] = useState([{
    id: 1,
    owner:"creator 2",
    title: "Sample Campaign",
    description: "Sample description",
    status: "Running In Progress",
    image: "https://via.placeholder.com/300"
  },]);

  const [myCampaigns] = useState([{
    id: 2,
    owner:"13276678136728",
    title: "Sample Campaign",
    description: "Sample description",
    status: "Running In Progress",
    image: "https://via.placeholder.com/300"
  },
  {
    id: 3,
    owner:"13276678136728",
    title: "Sample Campaign",
    description: "Sample description",
    status: "Running In Progress",
    image: "https://via.placeholder.com/300"
  }]);

  return (
    <div className="ml-64 p-8">
      <h1 className="text-white text-3xl mb-8">Campaigns Funding ({(campaigns.length)})</h1>
      <div className="grid grid-cols-3 gap-6">
        {campaigns.map((campaign, index) => (
          <CampaignCard key={index} campaign={campaign} />
        ))}
      </div>
      <h1 className="text-white text-3xl mb-8">My Campaigns ({(myCampaigns.length)})</h1>
      <div className="grid grid-cols-3 gap-6">
        {myCampaigns.map((campaign, index) => (
          <MyCards key={index} campaign={campaign}/>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;