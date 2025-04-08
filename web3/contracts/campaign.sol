// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Campaign {

    // Campaign 
    uint256 public creationTime;
    address public owner;
    string public title;
    string public photoLink; //Tx of Irys
    string public descriptionLink; //Tx of Irys
    uint256 public raisedAmount; // Amount raised in wei (now)
    uint256 public targetRaisedAmount; // Total funding goal in wei0
    
    uint256 public deadline; //time of the campaign end if all voting is not done
    Status public status;
    uint256 public tokenValue; // 1 token = 1000000000 wei initially ;after releaseFund of  milestone , token value will decrease
    mapping(address => uint256) public tokenPool; // Donor address => token amount
    uint256 public totalToken; // Total token amount raised

    enum Status { Active, Completed, Failed }

    // Milestone
    uint256 public onMilestone;// current milestone id

    uint256 public milestoneCount;
    mapping(uint256 => Milestone) public milestones;// milestoneId => Milestone

    struct Milestone {
        uint256 releaseRatio; //sum of all mile == 100
        Status status;
        MilestoneInfo proposalInfo;
        MilestoneInfo proofInfo;
        mapping(address => VoteOption) votingRecords;
        uint256 votingDeadline;
        mapping(VoteOption => uint256) votingResult;
    }

    enum VoteOption { Approve, Reject, NotVoteYet }
    
    struct MilestoneInfo {
        string title;
        string photoLink;
        string descriptionLink;
    }
    
    // Events
    event userDonated(address indexed user, address indexed campaign);
    event refund(address indexed donor, address indexed campaign, uint256 milestoneId);
    event newStatus(address indexed campaign, Status status);
    event newMilestoneStatus(address indexed campaign, uint256 milestoneId, Status status);
    event moveToNextMilestone(address indexed campaign, uint256 milestoneId);
    event milestoneProofSubmited(address indexed owner, address indexed campaign, uint256 milestoneId);
    event startVoting(address indexed owner, address indexed campaign, uint256 milestoneId);
    event voteOnMilestone(address indexed user, address indexed campaign, uint256 milestoneId);
    event votingResult(address indexed campaign, uint256 milestoneId, uint256 approveVotes, uint256 rejectVotes, uint256 NotVoteYetVotes);
    event releaseFundsToOwner(address indexed owner, address indexed campaign, uint256 milestoneId, uint256 amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyDonor() {
        require(tokenPool[msg.sender] > 0, "Only donors can call this function");
        _;
    }
    
    modifier campaignActive() {
        require(status == Status.Active, "Campaign is not active");
        _;
    }
    
    // Create a new campaign
    constructor(
        address _owner,
        string memory _title,
        string memory _photoLink,
        string memory _descriptionLink,
        uint256 _targetAmount,
        uint256 _deadline,
        uint256 _milestoneCount,
        uint256[] memory _milestoneReleaseRatio,
        string[] memory _milestoneTitles,
        string[] memory _milestonePhotoLinks,
        string[] memory _milestoneDescLinks
    ) {
        require(_milestoneCount > 0, "Must have at least one milestone");
        require(_milestoneCount == _milestoneReleaseRatio.length, "Milestone counts don't match");
        require(_milestoneCount == _milestoneTitles.length, "Milestone titles count mismatch");
        require(_milestoneCount == _milestonePhotoLinks.length, "Milestone photo links count mismatch");
        require(_milestoneCount == _milestoneDescLinks.length, "Milestone description links count mismatch");
        
        creationTime = block.timestamp;
        owner = _owner;
        title = _title;
        photoLink = _photoLink;
        descriptionLink = _descriptionLink;
        targetRaisedAmount = _targetAmount;
        deadline = _deadline;
        status = Status.Active;
        onMilestone = 0;
        tokenValue = 1000000000; // 1 tokens = 1000000000 wei
        milestoneCount = _milestoneCount;
        
        uint256 totalReleaseRatio = 0;
        for (uint256 i = 0; i < _milestoneCount; i++) {
            Milestone storage m = milestones[i];
            m.releaseRatio = _milestoneReleaseRatio[i];
            m.status = Status.Active;
            
            // Set milestone proposal info
            m.proposalInfo.title = _milestoneTitles[i];
            m.proposalInfo.photoLink = _milestonePhotoLinks[i];
            m.proposalInfo.descriptionLink = _milestoneDescLinks[i];
            totalReleaseRatio += _milestoneReleaseRatio[i];
        }
        require(totalReleaseRatio == 100, "Total release ratio != 100");
    }
    

    //donation function
    function donate() public payable campaignActive {
        require(msg.value > 0, "Air Donation X");
        require(block.timestamp < deadline, "Late donation X");
        //avoid use donation to update voting result after deadline
        calculateVotingResult();
        // Check if the campaign is still active
        require(status == Status.Active, "Campaign not active");
        uint256 tokensToAdd = msg.value / tokenValue;
        tokenPool[msg.sender] += tokensToAdd;
        totalToken += tokensToAdd;
        raisedAmount += msg.value;
        
        emit userDonated(msg.sender, address(this));
        
        updateStatus();
    }
    
    //get campaign info
    struct CampaignInfo {
        address owner;
        string title;
        string photoLink;
        string descriptionLink;
        uint256 raisedAmount;
        uint256 targetRaisedAmount;
        uint256 deadline;
        Status status;
        uint256 onMilestone;
        uint256 milestoneCount;
    }

    struct MilestoneInfoForReturn {
        uint256 releaseRatio;
        Status status;
        MilestoneInfo proposalInfo;
        MilestoneInfo proofInfo;
        uint256 votingDeadline;
        uint256 approveVotes;
        uint256 rejectVotes;
        uint256 notVoteYetVotes;
        VoteOption userVote;
    }

    function getInfo() public view returns (CampaignInfo memory) {
        return CampaignInfo(
            owner,
            title,
            photoLink,
            descriptionLink,
            raisedAmount,
            targetRaisedAmount,
            deadline,
            status,
            onMilestone,
            milestoneCount
        );
    }

    // Get information about a specific milestone
    function getMilestoneInfo(uint256 milestoneId) public view returns (MilestoneInfoForReturn memory) {
        require(milestoneId < milestoneCount, "Milestone does not exist");
        
        Milestone storage milestone = milestones[milestoneId];
        
        return MilestoneInfoForReturn({
            releaseRatio: milestone.releaseRatio,
            status: milestone.status,
            proposalInfo: milestone.proposalInfo,
            proofInfo: milestone.proofInfo,
            votingDeadline: milestone.votingDeadline,
            approveVotes: milestone.votingResult[VoteOption.Approve],
            rejectVotes: milestone.votingResult[VoteOption.Reject],
            notVoteYetVotes: milestone.votingResult[VoteOption.NotVoteYet],
            userVote: milestone.votingRecords[msg.sender]
        });
    }

    // Get all milestones info
    function getAllMilestones() public view returns (MilestoneInfoForReturn[] memory) {
        MilestoneInfoForReturn[] memory result = new MilestoneInfoForReturn[](milestoneCount);
        
        for (uint256 i = 0; i < milestoneCount; i++) {
            result[i] = getMilestoneInfo(i);
        }
        
        return result;
    }
    
    // submit milestone proof
    function submitMilestoneProof(
        uint256 milestoneId,
        string memory _title,
        string memory _photoLink,
        string memory _descriptionLink
    ) public onlyOwner campaignActive () {
        require(milestones[milestoneId].status == Status.Active, "Milestone is not active");
        
        milestones[milestoneId].proofInfo.title = _title;
        milestones[milestoneId].proofInfo.photoLink = _photoLink;
        milestones[milestoneId].proofInfo.descriptionLink = _descriptionLink;
        
        emit milestoneProofSubmited(owner, address(this), milestoneId);
    }
    
    //owner request voting for the current milestone
    function requestVoting() public onlyOwner campaignActive  () {
        require(bytes(milestones[onMilestone].proofInfo.photoLink).length > 0, "Proof must be submitted first");
        require(milestones[onMilestone].votingDeadline == 0, "Voting already started");
        
        milestones[onMilestone].votingDeadline = block.timestamp + 5 minutes; // 1 week voting period 5min for testing
        
        emit startVoting(owner, address(this), onMilestone);
    }
    
    //donor vote for the current milestone if is voting 
    function castVoteOnMilestone(bool approve) public onlyDonor campaignActive  () {
        uint256 milestoneId = onMilestone;
        require(milestones[milestoneId].votingDeadline > 0, "Voting has not started");
        require(block.timestamp < milestones[milestoneId].votingDeadline, "Late voting is not allowed");
        // can update ur vote before deadline
        // require(milestones[milestoneId].votingRecords[msg.sender] == VoteOption.NotVoteYet, "Already voted");
        // record the vote
        VoteOption vote = approve ? VoteOption.Approve : VoteOption.Reject;
        milestones[milestoneId].votingRecords[msg.sender] = vote;
        // milestones[milestoneId].votingResult[vote] += tokenPool[msg.sender];
        
        emit voteOnMilestone(msg.sender, address(this), milestoneId);
    }
    //caculate the voting result for the current milestone if needed 
    function calculateVotingResult() internal {
        uint256 milestoneId = onMilestone;

        if(milestones[milestoneId].votingDeadline > 0 && block.timestamp >= milestones[milestoneId].votingDeadline && milestones[milestoneId].status == Status.Active) {
            // Calculate the voting result
            milestones[milestoneId].votingResult[VoteOption.NotVoteYet] = totalToken;
            for (uint256 i = 0; i < milestoneCount; i++) {
                VoteOption vote = milestones[milestoneId].votingRecords[msg.sender];
                if (vote == VoteOption.Approve) {
                    milestones[milestoneId].votingResult[VoteOption.Approve] += tokenPool[msg.sender];
                } else if (vote == VoteOption.Reject) {
                    milestones[milestoneId].votingResult[VoteOption.Reject] += tokenPool[msg.sender];
                }
                milestones[milestoneId].votingResult[VoteOption.NotVoteYet] -= tokenPool[msg.sender];
            }
            // Update the milestone status 
            // approve > reject + not vote yet -> completed ; else failed
            if (milestones[milestoneId].votingResult[VoteOption.Approve] > (milestones[milestoneId].votingResult[VoteOption.Reject]+milestones[milestoneId].votingResult[VoteOption.NotVoteYet])) {
                milestones[milestoneId].status = Status.Completed;
            } else {
                milestones[milestoneId].status = Status.Failed;
                }
        }
        // Update the campaign status
        updateStatus();
        emit newMilestoneStatus(address(this), milestoneId, milestones[milestoneId].status);
    }


    //get voting result for the current milestone after deadline
    function getVotingResult(uint256 milestoneId) public returns (uint256 approveVotes, uint256 rejectVotes, uint256 notVoteYetVotes) {
        require(milestones[milestoneId].votingDeadline > 0, "Voting has not started");
        require(block.timestamp >= milestones[milestoneId].votingDeadline, "Voting is in progress");

        calculateVotingResult();
        approveVotes = milestones[milestoneId].votingResult[VoteOption.Approve];
        rejectVotes = milestones[milestoneId].votingResult[VoteOption.Reject];
        notVoteYetVotes = milestones[milestoneId].votingResult[VoteOption.NotVoteYet];
        
        return (approveVotes, rejectVotes, notVoteYetVotes);
    }
    
    //get token amount and token value of donor
    function getToken(address donorAddress) public view returns (uint256 amount, uint256) {
        amount = tokenPool[donorAddress];
        return (amount, tokenValue);
    }
    
    //owner can get the fund if the milestone is completed, also update the token value and move to the next milestone
    function releaseFunds(uint256 milestoneId) public onlyOwner () {
        require(milestones[milestoneId].status == Status.Active, "Milestone is not Active");
        require(milestoneId == onMilestone, "Can only release funds for current milestone");
        
        uint256 releaseRatio = milestones[milestoneId].releaseRatio;
        
        // Update token value after releasing funds
        if (milestoneId < milestoneCount - 1) {
            // Reduce token value for remaining milestones
            tokenValue = tokenValue - (1000000000*(releaseRatio/100)); 
        }
        
        onMilestone += 1;
        emit moveToNextMilestone(address(this), onMilestone);
        updateStatus();
        
        // Transfer funds to the owner
        payable(owner).transfer(releaseRatio);
        
        emit releaseFundsToOwner(owner, address(this), milestoneId, releaseRatio);
        
    }
    
    // request refund if the campaign failed or deadline passed without reaching target
    function requestRefund() public onlyDonor () {
        require(status == Status.Failed || (block.timestamp > deadline && status != Status.Completed), 
                "Refunds are only for campaign failed");
        
        uint256 tokenAmount = tokenPool[msg.sender];
        require(tokenAmount > 0, "No tokens to refund");
        
        uint256 refundAmount = tokenAmount * tokenValue;
        tokenPool[msg.sender] = 0;
        
        payable(msg.sender).transfer(refundAmount);
        emit refund(msg.sender, address(this), onMilestone);
        
    }
    
    // check the status of the campaign need update or not
    function updateStatus() internal {
        // Check if campaign deadline passed without reaching target
        if (block.timestamp > deadline && status != Status.Completed) {
            status = Status.Failed;

            emit newStatus(address(this), status);
        }
        
        // Check if all milestones are completed
        if (onMilestone >= milestoneCount) {
            status = Status.Completed;
            emit newStatus(address(this), status);
        }
        
    }
    

}
