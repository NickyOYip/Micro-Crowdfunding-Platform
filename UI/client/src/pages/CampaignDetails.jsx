import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AddMilestone from '../components/AddMilestone.jsx'
const CampaignDetails = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [addMilestone, setAddMilestone] = useState(null);

  const [formData, setFormData] = useState({
    id:'',
    proposalInfo:'',
    proofInfo:'',
    description: '',
    deadline: '',
    votingResults:{approve: null,reject: null}
  });

  // Sample voting data structure
  const [milestones]= useState([
    {
      id: 1,
      proposalInfo: "First Milestone",
      votingResults: { approve: 75, reject: 25 } // Sample data
    },
    {
      id: 2,
      proposalInfo: "Second Milestone",
      votingResults: { approve: 40, reject: 60 } // Sample data
    }
  ]);

  const handleFormSubmit = (submittedData) => {

    milestones.push(submittedData);
    console.log({milestones});

    setFormData({
      id:'',
      proposalInfo: '',
      description: '',
      deadline: '',
    });
  }

  const [campaign] = useState({
    photoLink: "https://via.placeholder.com/600",
    owner: "13276678136728",
    creatorName: "John Doe",
    description: "Sample campaign description",
    deadline: Date.now() + 86400000,
    raisedAmount: "1.5"
  });

  //get current (metamask/web3) account address
  const [account] = useState({
    owner: "13276678136728"
  });


  const VotingResultsModal = ({ results, onClose }) => {
    const totalVotes = results.approve + results.reject;
    const approvePercentage = (results.approve / totalVotes) * 100;
    const rejectPercentage = (results.reject / totalVotes) * 100;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold text-center mb-6">Voting Results</h2>

          <div className="mb-8">
            <table className="w-full mb-6">
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-2">Total Votes</td>
                  <td className="py-2 text-right">{totalVotes}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2">Approve</td>
                  <td className="py-2 text-right">{results.approve}</td>
                </tr>
                <tr>
                  <td className="py-2">Reject</td>
                  <td className="py-2 text-right">{results.reject}</td>
                </tr>
              </tbody>
            </table>

            {/* Pie Chart */}
            <div className="relative w-48 h-48 mx-auto mb-4">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(
                    #10B981 0% ${approvePercentage}%,
                    #EF4444 ${approvePercentage}% 100%
                  )`
                }}
              >
                <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <span className="block text-green-400 text-xl font-bold">
                      {approvePercentage.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-300">Approve</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ml-64 p-8 text-white">
      {selectedMilestone !== null && (
        <VotingResultsModal
          results={milestones[selectedMilestone].votingResults}
          onClose={() => setSelectedMilestone(null)}
        />
      )}

      {addMilestone !== null && (
        <AddMilestone
          milestone={milestones}
          formData={formData}
          onClose={() => setAddMilestone(null)}
          onSubmit={handleFormSubmit}
          setFormData={setFormData}
          index={[milestones].length+2}
        />
      )}
      

      {/* Campaign Image */}
      <div className="mb-8">
        <img
          src={campaign.photoLink}
          alt="Campaign"
          className="w-full h-96 object-cover rounded-xl"
        />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column - Campaign Info */}
        <div className="col-span-2 space-y-6" >
          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">{campaign.creatorName}</h2>
            <p className="text-gray-300">{campaign.description}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold"  >Milestones</h3>
              {/**  Add Milestone button can only be seen by campaign creater */}
              {campaign.owner == account.owner && (<button
                className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 text-white"
                onClick={() => setAddMilestone()}
              >
                Add Milestone
              </button>)}

            </div>

            <table className="w-full" >
              <tbody>
                {milestones.map((milestone, index) => (
                  <tr key={index} className="bg-gray-700 mb-4 last:mb-0">
                    <td className=" p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Milestone {index + 1}</h4>
                          <p className="text-gray-300">{milestone.proposalInfo}</p>
                        </div>
                        <button
                          onClick={() => setSelectedMilestone(index)}
                          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ml-4"
                        >
                          Voting Results
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Voting/Donation */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold">Days Left</h3>
              <p className="text-xl">{Math.ceil((campaign.deadline - Date.now() / 1000) / 86400)}</p>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold">Raised Amount</h3>
              <p className="text-xl">{campaign.raisedAmount} ETH</p>
            </div>
            {campaign.owner != account.owner && (
              <div>
                <button
                  onClick={() => navigate(`/vote/${id}`)}
                  className="w-full bg-pink-700 text-white py-3 rounded-lg hover:bg-[#d8d8f5] mb-4"
                >
                  Vote Now !
                </button>

                <div className="space-y-4">
                  <input
                    type="number"
                    placeholder="ETH Amount"
                    className="w-full bg-gray-700 text-white p-3 rounded-lg"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                  />
                  <button
                    className="w-full bg-[#646cff] text-white py-3 rounded-lg hover:bg-[#d8d8f5]"
                  >
                    Donate Now !
                  </button>
                </div>
              </div>
            )}

            {/**  Withdraw button can only be seen by campaign creater */}
            {account.owner === campaign.owner && (
              <button
                className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-[#d8d8f5] mt-4"
              >
                Withdraw Funds
              </button>)}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;