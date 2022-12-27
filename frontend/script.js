console.log("hello world!");
const provider = new ethers.providers.Web3Provider(window.ethereum);
const abi = [
  "event AccountOpened(uint256 indexed accountId, address indexed openUser, address[] owners, uint256 timestamp)",
  "event Deposited(uint256 indexed accountId, address indexed depositUser, uint256 amount, uint256 timestamp)",
  "event WithdrawApproved(uint256 indexed accountId, uint256 indexed withdrawId, address indexed approveUser, uint256 timestamp)",
  "event WithdrawRequested(uint256 indexed accountId, uint256 indexed withdrawId, address indexed requestUser, uint256 amount, uint256 timestamp)",
  "event Withdrew(uint256 indexed accountId, uint256 indexed withdrawId, address indexed withdrawUser, uint256 amount, uint256 timestamp)",
  "function approveWithdraw(uint256 accountId, uint256 withdrawId)",
  "function deposit(uint256 accountId) payable",
  "function getAccountBalance(uint256 accountId) view returns (uint256)",
  "function getAccountOwners(uint256 accountId) view returns (address[])",
  "function getApprovals(uint256 accountId, uint256 withdrawId) view returns (uint256)",
  "function getIsApproved(uint256 accountId, uint256 withdrawId) view returns (bool)",
  "function getUserAccounts() view returns (uint256[])",
  "function openAccount(address[] otherOwners)",
  "function requestWithdraw(uint256 accountId, uint256 amount)",
  "function withdraw(uint256 accountId, uint256 withdrawId)",
];
const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let contract = null;

async function getAccess() {
  if (contract) return;
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  contract = new ethers.Contract(address, abi, signer);
  console.log("accessed!");
  console.log(contract);
  // const eventLog = document.getElementById("events");
  // contract.on("AccountOpened", (id, user, owners) => {
  //     eventLog.append(`ID: ${id} USER: ${user}`);
  // })
}
//0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,0x90F79bf6EB2c4f870365E785982E1f101E93b906
async function openAccountHandler() {
  console.log("open account called!");
  await getAccess();
  const owners = document
    .getElementById("owners")
    .value.split(",")
    .filter((n) => n);
  console.log(owners);
  await contract.openAccount(owners);
  const eventLog = document.getElementById("events");
  contract.on("AccountOpened", (id, user, owners) => {
    eventLog.append(`ID: ${id} USER: ${user}`);
  });
}

async function getUserAccountsHandler() {
  console.log("get user's accounts called!");
  await getAccess();
  const result = await contract.getUserAccounts();
  console.log(result);
  document.getElementById("accounts").innerHTML = result;
}

async function depositHandler() {
  console.log("deposit!");
}

async function requestWithdrawHandler() {
  console.log("request withdrawl!");
}

async function approveWithdrawHandler() {
  console.log("approve withdrawl!");
}

async function withdrawHandler() {
  console.log("withdraw!");
}

async function getAccountBalanceHandler() {
  console.log("balance!");
}

async function getAccountOwnersHandler() {
  console.log("owners!");
}

async function getApprovalsHandler() {
  console.log("approvals!");
}

async function getIsApprovedHandler() {
  console.log("isApproved!");
}
