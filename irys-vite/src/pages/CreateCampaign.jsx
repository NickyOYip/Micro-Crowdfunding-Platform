import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    creatorName: '',
    title: '',
    description: '',
    target: '',
    deadline: '',
    image: null,
    milestones: ['']
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, '']
    }));
  };

  return (
    <div className="ml-64 p-8 text-white">
      <div className="bg-gray-800 p-8 rounded-xl max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Start A New Campaign!</h1>

        {/* Fix comment syntax */}
        <div>
        <label className="block mb-2">Campaign Creator Address *</label>
        <input
            required
            className="w-full bg-gray-700 p-3 rounded-lg" 
            style={{border:"solid #646cff"}}
            placeholder="Write your address"
            value={formData.creatorName}
            onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
        />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2">Campaign Title *</label>
            <input
              required
              className="w-full bg-gray-700 p-3 rounded-lg"
              style={{border:"solid #646cff"}}
              placeholder="Write a title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2">Story *</label>
            <textarea
              required
              className="w-full bg-gray-700 p-3 rounded-lg h-32"
              style={{border:"solid #646cff"}}
              placeholder="Introduce your campaign"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2">Milestones *</label>
            {formData.milestones.map((milestone, index) => (
              <input
                key={index}
                className="w-full bg-gray-700 p-3 rounded-lg mb-2"
                style={{border:"solid #646cff"}}
                placeholder={`Milestone ${index + 1}`}
                value={milestone}
                onChange={(e) => {
                  const newMilestones = [...formData.milestones];
                  newMilestones[index] = e.target.value;
                  setFormData({ ...formData, milestones: newMilestones });
                }}
              />
            ))}
            <button
              type="button"
              onClick={addMilestone}
              className="text-white bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Add Milestone +
            </button>
          </div>

          <div>
            <label className="block mb-2">End Date *</label>
            <input
                type="date"
                required
                className="w-full bg-gray-700 p-3 rounded-lg"
                style={{border:"solid #646cff"}}
                placeholder="dd/mm/yy"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2">Campaign Image *</label>
            <div className="bg-gray-700 p-4 rounded-lg border-2 border-dashed border-#646cff">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                className="hidden"
                id="imageUpload"
              />
              <label 
                htmlFor="imageUpload" 
                className="cursor-pointer text-gray-400"
              >
                {formData.image ? formData.image.name : 'Upload Campaign Image'}
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#646cff] text-white py-4 rounded-lg hover:bg-blue-700 text-lg"
          >
            Create Campaign
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;