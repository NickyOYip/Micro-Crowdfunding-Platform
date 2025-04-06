import CampaignCard from '../components/CampaignCard';
import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from "../../src2/provider/dataProvider";
import { WalletContext } from "../../src2/provider/walletProvider";
import * as IrysActions from "../../src2/hooks/irysHook/irysAction";
import MyCards from '../components/MyCards';

//Show my campaigns and campaigns I funded 

const Dashboard = () => { 
  const navigate = useNavigate();
  const { walletStatus, irysStatus, connectWallet } = useContext(WalletContext);
  const [irysAddress, setIrysAddress] = useState("");

  //get data
  const {data} = useContext(DataContext);
  const user = data.sampleUserProfile;
  const campaigns = user[0].campaigns;
  const isConnected = data.irysUploader !== null;

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected]);

  const [campaign] = useState([{
    id: 1,
    owner:"creator 2",
    title: "Sample Campaign",
    description: "Sample description",
    status: "Running In Progress",
    image: "https://via.placeholder.com/300"
  },]);

  const [myCampaign] = useState([{
    id: 2,
    owner:"13276678136728",
    title: "Sample Campaign",
    description: "Sample description",
    status: "Voting in Progress",
    image: "https://via.placeholder.com/300"
  },
  {
    id: 3,
    owner:"13276678136728",
    title: "Sample Campaign",
    description: "Sample description",
    status: "Withdraw Available",
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
      <h1 className="text-white text-3xl mb-8">My Campaigns ({(myCampaign.length)})</h1>
      <div className="grid grid-cols-3 gap-6">
        {myCampaign.map((campaign, index) => (
          <MyCards key={index} campaign={campaign}/>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
