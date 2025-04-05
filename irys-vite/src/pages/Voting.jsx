import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const VotingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [votes, setVotes] = useState({});

  const handleSubmit = () => {
    navigate(`/campaign/${id}`);
  };

  const [milestones] = useState([
    { proposalInfo: "Sample Milestone", proofInfo: "Proof details" }
  ]);

  const handleVoteChange = (milestoneId, vote) => {
    setVotes(prev => ({ ...prev, [milestoneId]: vote }));
  };

  return (
    <div className="ml-64 p-8 text-white">
      <div className="bg-gray-800 p-8 rounded-xl max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Voting</h1>
        <p className="mb-8 text-gray-300">
          Please select your votes for each milestone
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-4 w-2/3">Milestone</th>
                <th className="text-left py-4">Vote</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone, index) => (
                <tr key={index} className="border-t border-gray-700">
                  <td className="py-4">
                    <h3 className="font-medium">{milestone.proposalInfo}</h3>
                    <p className="text-gray-400 text-sm">{milestone.proofInfo}</p>
                  </td>
                  <td className="py-4">
                  <div className="flex gap-4">
                      <button
                        onClick={() => handleVoteChange(index, true)}
                        className={`px-4 py-2 rounded-lg w-24 flex-shrink-0 ${
                          votes[index] === true 
                            ? 'bg-green-600 opacity-90' 
                            : 'bg-green-500 hover:bg-green-600'
                        } text-white transition-all`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVoteChange(index, false)}
                        className={`px-4 py-2 rounded-lg w-24 flex-shrink-0 ${
                          votes[index] === false 
                            ? 'bg-red-600 opacity-90' 
                            : 'bg-red-500 hover:bg-red-600'
                        } text-white transition-all`}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-8 bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600"
        >
          Done Voting
        </button>
      </div>
    </div>
  );
};

export default VotingPage;