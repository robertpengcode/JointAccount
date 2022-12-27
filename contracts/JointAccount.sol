// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

contract JointAccount {

    event AccountOpened(uint indexed accountId, address indexed openUser, address[] owners, uint timestamp);
    event Deposited(uint indexed accountId, address indexed depositUser, uint amount, uint timestamp);
    event WithdrawRequested(uint indexed accountId, uint indexed withdrawId, address indexed requestUser, uint amount, uint timestamp);
    event WithdrawApproved(uint indexed accountId, uint indexed withdrawId, address indexed approveUser, uint timestamp);
    event Withdrew(uint indexed accountId, uint indexed withdrawId, address indexed withdrawUser, uint amount, uint timestamp);

    struct Account {
        address[] owners;
        uint balance;
        mapping(uint => WithdrawRequest) withdrawRequests;
    }

    struct WithdrawRequest {
        address requestUser;
        uint numOfApproved;
        uint withdrawAmount;
        mapping(address => bool) ownerApprovals;
        bool isApproved;
    }

    mapping(uint => Account) accounts;
    mapping(address => uint[]) userAccounts;

    uint nextAccountId;
    uint nextWithdrawId;

    modifier ownerOnly(uint accountId) {
        bool isOwner;
        for(uint i; i < accounts[accountId].owners.length; i++){
            if (accounts[accountId].owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "owner only");
        _;
    }
    modifier sufficientBalance1(uint accountId, uint amount) {
        require(accounts[accountId].balance >= amount, "insufficient balance");
        _;
    }

    modifier sufficientBalance2(uint accountId, uint withdrawId) {
        require(accounts[accountId].balance >= accounts[accountId].withdrawRequests[withdrawId].withdrawAmount, "insufficient balance");
        _;
    }

    modifier notTheSame(address[] calldata otherOwners) {
        for(uint i; i<otherOwners.length; i++) {
            if(otherOwners[i] == msg.sender) {
                revert("duplicated owners");
            }
            for(uint j = i+1; j<otherOwners.length; j++) {
                if(otherOwners[i] == otherOwners[j]) {
                    revert("duplicated owners");
                }
            }
        }
        _;
    }

    modifier canWithdraw(uint accountId, uint withdrawId) {
        require(accounts[accountId].withdrawRequests[withdrawId].isApproved, "withdraw has not been approved yet");
        require(accounts[accountId].withdrawRequests[withdrawId].requestUser == msg.sender, "only requester can withdraw");
        _;
    }

    modifier canApprove(uint accountId, uint withdrawId) {
        require(!accounts[accountId].withdrawRequests[withdrawId].isApproved, "withdraw has been approved");
        require(accounts[accountId].withdrawRequests[withdrawId].requestUser != msg.sender, "withdraw requester cannot approve");
        require(accounts[accountId].withdrawRequests[withdrawId].requestUser != address(0), "invalid withdraw request");
        require(!accounts[accountId].withdrawRequests[withdrawId].ownerApprovals[msg.sender], "approved by this owner already");
        _;
    }

    function openAccount(address[] calldata otherOwners) external notTheSame(otherOwners){
        require(otherOwners.length + 1 <= 4, "account has max 4 owners");
        uint id = nextAccountId;
        address[] memory owners = new address[](otherOwners.length + 1);
        owners[otherOwners.length] = msg.sender;
        for (uint i; i < owners.length; i++) {
            if (i < owners.length - 1) {
                owners[i] = otherOwners[i];
            }
            require(userAccounts[owners[i]].length < 3, "user has max 3 accounts");
            userAccounts[owners[i]].push(id);
        }
        accounts[id].owners = owners;
        nextAccountId++;
        emit AccountOpened(id, msg.sender, owners, block.timestamp);  
    }

    function deposit(uint accountId) external payable ownerOnly(accountId){
        accounts[accountId].balance += msg.value;
        emit Deposited(accountId, msg.sender, msg.value, block.timestamp);
    }

    function requestWithdraw(uint accountId, uint amount) external ownerOnly(accountId) sufficientBalance1(accountId, amount){
        uint id = nextWithdrawId;
        WithdrawRequest storage newRequest = accounts[accountId].withdrawRequests[id];
        newRequest.requestUser = msg.sender;
        newRequest.withdrawAmount = amount;
        if(accounts[accountId].owners.length == 1) {
            newRequest.isApproved = true;
        }
        nextWithdrawId++;
        emit WithdrawRequested(accountId, id, msg.sender, amount, block.timestamp); 
    }

    function approveWithdraw(uint accountId, uint withdrawId) external ownerOnly(accountId) canApprove(accountId, withdrawId) {
        WithdrawRequest storage request = accounts[accountId].withdrawRequests[withdrawId];
        request.ownerApprovals[msg.sender] = true;
        request.numOfApproved++;
        if (request.numOfApproved == accounts[accountId].owners.length -1) {
            request.isApproved = true;
        }
        emit WithdrawApproved(accountId, withdrawId, msg.sender, block.timestamp);
    }

    function withdraw(uint accountId, uint withdrawId) external canWithdraw(accountId, withdrawId) sufficientBalance2(accountId, withdrawId){
        uint amount = accounts[accountId].withdrawRequests[withdrawId].withdrawAmount;
        accounts[accountId].balance -= amount;
        delete accounts[accountId].withdrawRequests[withdrawId];
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "sent withdraw failed");
        emit Withdrew(accountId, withdrawId, msg.sender, amount, block.timestamp);
    }

    function getAccountBalance(uint accountId) public view returns(uint){
        return accounts[accountId].balance;
    }

    function getAccountOwners(uint accountId) public view returns(address[] memory){
        return accounts[accountId].owners;
    }

    function getApprovals(uint accountId, uint withdrawId) public view returns(uint){
        return accounts[accountId].withdrawRequests[withdrawId].numOfApproved;
    }

    function getUserAccounts() public view returns(uint[] memory) {
        return userAccounts[msg.sender];
    }

    function getIsApproved(uint accountId, uint withdrawId) public view returns(bool){
        return accounts[accountId].withdrawRequests[withdrawId].isApproved;
    }
}