import { Link } from 'react-router-dom';

const CampaignCard = ({ campaign }) => {
    // components/CampaignCard.jsx
    const getStatusStyle = (status) => {
        const styles = {
        'Running In Progress': 'bg-white text-black',
        'Can Voting': 'bg-yellow-100 text-black',
        'Done in Funding': 'bg-green-100 text-black'
        }; 
        return `${styles[status] || 'bg-white text-black'} px-3 py-1 rounded-full `;
    };
  
    return (
      <Link to={`/campaign/${campaign.id}`}> {/* Wrap content in Link */}
        <div className="campaign-card bg-gray-800 rounded-xl p-6 cursor-pointer">
          <img 
            src={campaign.image} 
            alt={campaign.title} 
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h3 className="text-white font-bold text-xl mb-2">{campaign.title}</h3>
          <p className="text-gray-400 text-sm mb-4">{campaign.description}</p>
          <div style={{width:"fit-content",fontSize:"medium"}} className={getStatusStyle(campaign.status)}>
            {campaign.status}
          </div>
        </div>
      </Link>
    );
};

export default CampaignCard;