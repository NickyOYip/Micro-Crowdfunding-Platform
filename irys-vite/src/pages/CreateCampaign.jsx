import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../provider/dataProvider';
import { WalletContext } from '../provider/walletProvider';
import useFactory from '../hooks/useFactory';
import { uploadData, uploadString, checkBalance, fundAccount, getPrice } from '../hooks/irysHook/irysAction';
import { ethers } from 'ethers';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { data } = useContext(DataContext);
  const { walletStatus, connectWallet } = useContext(WalletContext);
  const { createCampaign } = useFactory();
  const { irysUploader, ethProvider } = data;
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState('0');
  const [needsFunding, setNeedsFunding] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [isFunding, setIsFunding] = useState(false);
  const [progressStep, setProgressStep] = useState(''); // For tracking progress

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    deadline: '',
    image: null,
    milestones: [
      {
        title: '',
        description: '',
        image: null,
        releaseRatio: 100
      }
    ]
  });
  
  // Check wallet connection
  useEffect(() => {
    if (!ethProvider) {
      setError('Please connect your wallet first');
    } else {
      setError('');
    }
  }, [ethProvider]);

  // Check Irys balance when component mounts or when irysUploader changes
  useEffect(() => {
    if (irysUploader) {
      checkIrysBalance();
    }
  }, [irysUploader]);
  
  // Function to check Irys balance
  const checkIrysBalance = async () => {
    try {
      if (!irysUploader) return;
      
      const currentBalance = await checkBalance(irysUploader);
      setBalance(currentBalance);
      console.log('Current Irys balance:', currentBalance);
    } catch (err) {
      console.error('Error checking Irys balance:', err);
      setError('Error checking Irys balance');
    }
  };
  
  // Estimate upload cost based on file sizes
  const estimateUploadCost = async () => {
    try {
      if (!irysUploader || !formData.image) return '0';
      
      // Estimate size of all data being uploaded
      let totalBytes = 0;
      
      // Main campaign image size
      if (formData.image) {
        totalBytes += formData.image.size;
      }
      
      // Description text size - now handled by uploadString
      const descriptionBytes = Buffer.byteLength(formData.description, 'utf-8');
      totalBytes += descriptionBytes;
      
      // Milestone data sizes
      for (const milestone of formData.milestones) {
        if (milestone.image) {
          totalBytes += milestone.image.size;
        }
        const milestoneDescBytes = Buffer.byteLength(milestone.description, 'utf-8');
        totalBytes += milestoneDescBytes;
      }
      
      // Add buffer for metadata (20%)
      totalBytes = Math.ceil(totalBytes * 1.2);
      
      // Get price estimate
      const price = await getPrice(irysUploader, totalBytes);
      setEstimatedCost(price);
      return price;
    } catch (err) {
      console.error('Error estimating upload cost:', err);
      return '0';
    }
  };
  
  // Fund Irys account
  const fundIrysAccount = async (amount) => {
    try {
      setIsFunding(true);
      setSuccess('Funding Irys account...');
      
      // Fund with a minimum amount (0.01 ETH) or the estimated cost, whichever is greater
      const minFundAmount = '0.01';
      const fundAmount = amount ? amount : minFundAmount;
      
      await fundAccount(irysUploader, fundAmount);
      
      // Check updated balance
      await checkIrysBalance();
      setSuccess(`Irys account funded with ${fundAmount} ETH`);
      setNeedsFunding(false);
      
      return true;
    } catch (err) {
      console.error('Error funding Irys account:', err);
      setError(`Error funding Irys account: ${err.message}`);
      return false;
    } finally {
      setIsFunding(false);
    }
  };
  
  // Handle file changes
  const handleFileChange = (e, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (index === null) {
      // Main campaign image
      setFormData({ ...formData, image: file });
    } else {
      // Milestone image
      const newMilestones = [...formData.milestones];
      newMilestones[index] = { ...newMilestones[index], image: file };
      setFormData({ ...formData, milestones: newMilestones });
    }
  };

  // Add milestone
  const addMilestone = () => {
    if (formData.milestones.length >= 5) {
      setError('Maximum 5 milestones allowed');
      return;
    }

    const currentTotalRatio = formData.milestones.reduce(
      (sum, milestone) => sum + (parseInt(milestone.releaseRatio) || 0), 
      0
    );
    
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones, 
        {
          title: '',
          description: '',
          image: null,
          releaseRatio: 100 - currentTotalRatio
        }
      ]
    }));
  };

  // Update milestone data
  const updateMilestone = (index, field, value) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    
    // Recalculate release ratios if needed
    if (field === 'releaseRatio') {
      const newRatio = parseInt(value) || 0;
      const oldRatio = parseInt(formData.milestones[index].releaseRatio) || 0;
      const difference = newRatio - oldRatio;
      
      // Check if total would exceed 100%
      const total = formData.milestones.reduce(
        (sum, m, i) => sum + (i === index ? newRatio : (parseInt(m.releaseRatio) || 0)), 
        0
      );
      
      if (total > 100) {
        setError('Total release ratio cannot exceed 100%');
        return;
      }
    }
    
    setFormData({ ...formData, milestones: newMilestones });
  };

  // Remove milestone
  const removeMilestone = (index) => {
    if (formData.milestones.length <= 1) {
      setError('At least one milestone is required');
      return;
    }
    
    const newMilestones = formData.milestones.filter((_, i) => i !== index);
    setFormData({ ...formData, milestones: newMilestones });
  };

  // Upload files to Irys and get transaction IDs
  const uploadToIrys = async () => {
    if (!irysUploader) {
      throw new Error('Irys uploader not initialized. Please connect your wallet.');
    }

    setIsUploading(true);
    try {
      // Check balance and estimate cost before uploading
      const currentBalance = await checkBalance(irysUploader);
      const estimatedCost = await estimateUploadCost();
      
      console.log(`Current balance: ${currentBalance}, Estimated cost: ${estimatedCost}`);
      
      // If balance is insufficient, fund the account
      if (BigInt(currentBalance) < BigInt(estimatedCost)) {
        setNeedsFunding(true);
        setSuccess('Insufficient Irys funds. Please fund your account before uploading.');
        setProgressStep('funding_needed');
        
        // Calculate how much to fund (estimated cost + 10% buffer)
        const fundAmount = (BigInt(estimatedCost) - BigInt(currentBalance) + BigInt(estimatedCost) / BigInt(10)).toString();
        const ethAmount = ethers.formatEther(fundAmount);
        
        // Fund with at least 0.01 ETH
        const minFundAmount = '0.01';
        const fundingAmount = parseFloat(ethAmount) < parseFloat(minFundAmount) ? minFundAmount : ethAmount;
        
        setSuccess(`Funding Irys account with ${fundingAmount} ETH...`);
        const funded = await fundIrysAccount(fundingAmount);
        
        if (!funded) {
          throw new Error('Failed to fund Irys account');
        }
        
        setSuccess('Account funded. Continuing with upload...');
      }
      
      setProgressStep('uploading_image');
      // Upload main campaign image
      setSuccess('Uploading campaign image...');
      
      let campaignImageReceipt;
      if (formData.image) {
        // Use uploadData for files
        campaignImageReceipt = await uploadData(irysUploader, formData.image);
      } else {
        throw new Error('Campaign image is required');
      }
      
      setProgressStep('uploading_description');
      // Upload main campaign description - use uploadString for text content
      setSuccess('Uploading campaign description...');
      const campaignDescriptionReceipt = await uploadString(
        irysUploader, 
        formData.description
      );
      
      // Upload milestone data
      const milestoneData = await Promise.all(formData.milestones.map(async (milestone, index) => {
        setProgressStep(`uploading_milestone_${index + 1}`);
        setSuccess(`Uploading milestone ${index + 1}...`);
        
        let milestoneImageReceipt = { id: '' }; // Default empty ID
        
        if (milestone.image) {
          // Use uploadData for files
          milestoneImageReceipt = await uploadData(irysUploader, milestone.image);
        }
          
        // Use uploadString for text content
        const milestoneDescriptionReceipt = await uploadString(
          irysUploader, 
          milestone.description
        );
          
        return {
          title: milestone.title,
          photoLink: milestoneImageReceipt.id,
          descriptionLink: milestoneDescriptionReceipt.id,
          releaseRatio: parseInt(milestone.releaseRatio)
        };
      }));

      return {
        photoLink: campaignImageReceipt.id,
        descriptionLink: campaignDescriptionReceipt.id,
        milestones: milestoneData
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setProgressStep('');

    // Validation
    if (!ethProvider) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!formData.image) {
      setError('Campaign image is required');
      return;
    }
    
    // Check milestone release ratios
    const totalReleaseRatio = formData.milestones.reduce(
      (sum, milestone) => sum + (parseInt(milestone.releaseRatio) || 0), 
      0
    );
    
    if (totalReleaseRatio !== 100) {
      setError(`Total milestone release ratio must be 100% (currently ${totalReleaseRatio}%)`);
      return;
    }
    
    try {
      setIsUploading(true);
      
      setProgressStep('estimating');
      // First estimate the cost
      const cost = await estimateUploadCost();
      setEstimatedCost(cost);
      
      // Check if balance is sufficient
      const currentBalance = await checkBalance(irysUploader);
      setBalance(currentBalance);
      
      if (BigInt(currentBalance) < BigInt(cost)) {
        setNeedsFunding(true);
        setProgressStep('funding_needed');
        setSuccess(`Insufficient Irys funds. You have ${ethers.formatEther(currentBalance)} ETH, but need approximately ${ethers.formatEther(cost)} ETH.`);
        return; // Stop here and let user fund
      }
      
      setProgressStep('uploading');
      setSuccess('Uploading files to Irys...');
      
      // Upload all files and get transaction IDs
      const uploadedData = await uploadToIrys();
      
      setProgressStep('creating');
      setSuccess('Creating campaign on blockchain...');
      
      // Calculate deadline timestamp
      const deadlineDate = new Date(formData.deadline);
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);
      
      // Create campaign
      const campaignAddress = await createCampaign({
        title: formData.title,
        photoLink: uploadedData.photoLink,
        descriptionLink: uploadedData.descriptionLink,
        targetAmount: formData.targetAmount,
        deadline: deadlineTimestamp,
        milestones: uploadedData.milestones
      });
      
      setProgressStep('success');
      setSuccess(`Campaign created successfully! Address: ${campaignAddress}`);
      
      // Navigate to the campaign page
      setTimeout(() => {
        navigate(`/campaign/${campaignAddress}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(`Error creating campaign: ${err.message}`);
      setProgressStep('error');
    } finally {
      setIsUploading(false);
    }
  };

  // Fund account manually
  const handleFundAccount = async () => {
    const fundAmount = "0.01"; // Default to 0.01 ETH
    await fundIrysAccount(fundAmount);
  };

  return (
    <div className="ml-64 p-8 text-white">
      <div className="bg-gray-800 p-8 rounded-xl max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Start A New Campaign!</h1>

        {!ethProvider && (
          <div className="bg-yellow-800 text-yellow-100 p-4 mb-6 rounded-lg">
            <p>You need to connect your wallet to create a campaign</p>
            <button
              onClick={connectWallet}
              className="mt-2 bg-yellow-700 hover:bg-yellow-600 text-white py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="campaign-title" className="block mb-2">Title *</label>
            <input
              id="campaign-title"
              name="title"
              required
              className="w-full bg-gray-700 p-3 rounded-lg"
              style={{border:"solid #646cff"}}
              placeholder="Write a title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isUploading}
            />
          </div>

          <div>
            <label htmlFor="campaign-description" className="block mb-2">Description *</label>
            <textarea
              id="campaign-description"
              name="description"
              required
              className="w-full bg-gray-700 p-3 rounded-lg h-32"
              style={{border:"solid #646cff"}}
              placeholder="Introduce your campaign"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isUploading}
            />
          </div>

          <div>
            <label htmlFor="campaign-target" className="block mb-2">Target Amount (ETH) *</label>
            <input
              id="campaign-target"
              name="targetAmount"
              type="number"
              step="0.001"
              min="0.001"
              required
              className="w-full bg-gray-700 p-3 rounded-lg"
              style={{border:"solid #646cff"}}
              placeholder="1.0"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              disabled={isUploading}
            />
          </div>

          <div>
            <label htmlFor="campaign-deadline" className="block mb-2">End Date *</label>
            <input
              id="campaign-deadline"
              name="deadline"
              type="date"
              required
              className="w-full bg-gray-700 p-3 rounded-lg"
              style={{border:"solid #646cff"}}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Min tomorrow
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block mb-2">Campaign Image *</label>
            <div className="bg-gray-700 p-4 rounded-lg border-2 border-dashed border-gray-500">
              <input
                id="imageUpload"
                name="campaignImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e)}
                className="hidden"
                disabled={isUploading}
                required
              />
              <label 
                htmlFor="imageUpload" 
                className="cursor-pointer text-gray-400 flex items-center justify-center"
              >
                {formData.image ? (
                  <div className="flex items-center">
                    <span className="mr-2">{formData.image.name}</span>
                    <img 
                      src={URL.createObjectURL(formData.image)} 
                      alt="Preview" 
                      className="h-20 w-auto" 
                    />
                  </div>
                ) : (
                  'Upload Campaign Image'
                )}
              </label>
            </div>
          </div>

          {/* Milestones Section */}
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Milestones</h2>
              <span className="text-sm">
                Total: {formData.milestones.reduce((sum, m) => sum + (parseInt(m.releaseRatio) || 0), 0)}%
              </span>
            </div>

            {formData.milestones.map((milestone, index) => (
              <div key={index} className="border border-gray-600 rounded-lg p-4">
                <div className="flex justify-between">
                  <h3 className="font-bold">Milestone {index + 1}</h3>
                  {formData.milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="text-red-500"
                      disabled={isUploading}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4 mt-3">
                  <div>
                    <label htmlFor={`milestone-title-${index}`} className="block mb-1">Title *</label>
                    <input
                      id={`milestone-title-${index}`}
                      name={`milestone-title-${index}`}
                      required
                      className="w-full bg-gray-700 p-2 rounded-lg"
                      style={{border:"solid #646cff"}}
                      placeholder="Milestone title"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label htmlFor={`milestone-description-${index}`} className="block mb-1">Description *</label>
                    <textarea
                      id={`milestone-description-${index}`}
                      name={`milestone-description-${index}`}
                      required
                      className="w-full bg-gray-700 p-2 rounded-lg h-20"
                      style={{border:"solid #646cff"}}
                      placeholder="Describe this milestone"
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Image</label>
                    <div className="bg-gray-700 p-3 rounded-lg border border-dashed border-gray-500">
                      <input
                        id={`milestoneImage${index}`}
                        name={`milestone-image-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, index)}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor={`milestoneImage${index}`} 
                        className="cursor-pointer text-gray-400 flex items-center justify-center"
                      >
                        {milestone.image ? (
                          <div className="flex items-center">
                            <span className="mr-2">{milestone.image.name}</span>
                            <img 
                              src={URL.createObjectURL(milestone.image)} 
                              alt="Preview" 
                              className="h-16 w-auto" 
                            />
                          </div>
                        ) : (
                          'Upload Milestone Image (Optional)'
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`milestone-ratio-${index}`} className="block mb-1">Release Ratio (%) *</label>
                    <input
                      id={`milestone-ratio-${index}`}
                      name={`milestone-ratio-${index}`}
                      type="number"
                      min="1"
                      max="100"
                      required
                      className="w-full bg-gray-700 p-2 rounded-lg"
                      style={{border:"solid #646cff"}}
                      placeholder="Percentage of funds to release (1-100)"
                      value={milestone.releaseRatio}
                      onChange={(e) => updateMilestone(index, 'releaseRatio', e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addMilestone}
              className="w-full border border-gray-500 text-gray-300 py-2 rounded-lg hover:bg-gray-700"
              disabled={isUploading || formData.milestones.length >= 5}
            >
              Add Milestone +
            </button>
          </div>

          {/* Status Messages - Now moved to bottom */}
          <div className="mt-8">
            {/* Progress indicator */}
            {progressStep && (
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-lg mb-2">Campaign Creation Progress</h3>
                <div className="space-y-2">
                  {['estimating', 'uploading', 'creating', 'success'].map((step, index) => {
                    const isActive = progressStep === step;
                    const isCompleted = ['uploading', 'creating', 'success'].indexOf(progressStep) >= 
                                       ['uploading', 'creating', 'success'].indexOf(step);
                    
                    return (
                      <div 
                        key={step}
                        className={`flex items-center ${isActive ? 'text-blue-300' : 
                                 isCompleted ? 'text-green-300' : 'text-gray-400'}`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2
                                        ${isActive ? 'bg-blue-500' : 
                                          isCompleted ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {isCompleted && !isActive ? (
                            '✓'
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span>
                          {step === 'estimating' && 'Estimating costs'}
                          {step === 'uploading' && 'Uploading files to Irys'}
                          {step === 'creating' && 'Creating campaign on blockchain'}
                          {step === 'success' && 'Campaign created successfully'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Irys Balance Information - Moved here from top */}
            {ethProvider && (
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">Storage Funding Status</div>
                  <button
                    type="button"
                    onClick={checkIrysBalance}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded text-sm"
                    disabled={isUploading || isFunding}
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span>Irys Balance:</span>
                  <span className="font-mono">{balance ? ethers.formatEther(balance) : '0'} ETH</span>
                </div>
                {estimatedCost !== '0' && (
                  <div className="mt-1 flex justify-between items-center">
                    <span>Estimated Cost:</span>
                    <span className="font-mono">~{ethers.formatEther(estimatedCost)} ETH</span>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-800 text-red-100 p-4 mb-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="bg-green-800 text-green-100 p-4 mb-4 rounded-lg">
                {success}
              </div>
            )}
            
            {/* Funding needed message */}
            {needsFunding && (
              <div className="bg-yellow-800 text-yellow-100 p-4 mb-4 rounded-lg">
                <p>Additional funding is needed for uploading files to Irys.</p>
                <button
                  type="button"
                  onClick={handleFundAccount}
                  className="mt-2 bg-yellow-700 hover:bg-yellow-600 text-white py-2 px-4 rounded"
                  disabled={isUploading || isFunding}
                >
                  {isFunding ? 'Funding...' : 'Fund Irys Account (0.01 ETH)'}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              id="estimate-cost-btn"
              name="estimate-cost"
              onClick={async () => {
                setProgressStep('estimating');
                const cost = await estimateUploadCost();
                setEstimatedCost(cost);
                await checkIrysBalance();
                if (BigInt(balance) < BigInt(cost)) {
                  setNeedsFunding(true);
                }
                setProgressStep('');
              }}
              className="bg-gray-600 hover:bg-gray-500 text-white py-4 px-6 rounded-lg text-lg"
              disabled={isUploading || isFunding || !ethProvider}
            >
              Estimate Cost
            </button>
            
            <button
              type="submit"
              id="create-campaign-btn"
              name="create-campaign"
              className="flex-1 ml-4 bg-[#646cff] text-white py-4 rounded-lg hover:bg-blue-700 text-lg disabled:opacity-50"
              disabled={isUploading || isFunding || !ethProvider || needsFunding}
            >
              {isUploading ? 'Creating Campaign...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;