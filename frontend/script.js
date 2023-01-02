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
}
//0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,0x90F79bf6EB2c4f870365E785982E1f101E93b906
async function openAccountHandler() {
  await getAccess();
  const owners = document
    .getElementById("owners")
    .value.split(",")
    .filter((n) => n);
  await contract
    .openAccount(owners)
    .then(() => alert("Open Account Success!"))
    .catch((err) => alert(err));
  // const eventLog = document.getElementById("events");
  // contract.on("AccountOpened", (id, user, owners) => {
  //   eventLog.append(`ID: ${id} USER: ${user}`);
  // });
}

async function depositHandler() {
  const acctIdDep = document.getElementById("acctIdDep").value;
  const amountDep = document.getElementById("amountDep").value;
  if (!acctIdDep || !amountDep) return;
  await contract
    .deposit(acctIdDep, { value: amountDep })
    .then(() => alert("Deposit Success!"))
    .catch((err) => alert(err));
}

async function requestWithdrawHandler() {
  const acctIdReq = document.getElementById("acctIdReq").value;
  const amountReq = document.getElementById("amountReq").value;
  if (!acctIdReq || !amountReq) return;
  await contract
    .requestWithdraw(acctIdReq, amountReq)
    .then(() => alert("Request Withdrawl Success!"))
    .catch((err) => alert(err));
}

async function approveWithdrawHandler() {
  const acctIdApp = document.getElementById("acctIdApp").value;
  const withdrawIdApp = document.getElementById("withdrawIdApp").value;
  if (!acctIdApp || !withdrawIdApp) return;
  await contract
    .approveWithdraw(acctIdApp, withdrawIdApp)
    .then(() => alert("Approve Withdrawl Success!"))
    .catch((err) => alert(err));
}

async function withdrawHandler() {
  const acctIdWith = document.getElementById("acctIdWith").value;
  const withdrawIdWith = document.getElementById("withdrawIdWith").value;
  if (!acctIdWith || !withdrawIdWith) return;
  await contract
    .withdraw(acctIdWith, withdrawIdWith)
    .then(() => alert("Withdraw Success!"))
    .catch((err) => alert(err));
}

async function getUserAccountsHandler() {
  await getAccess();
  const result = await contract.getUserAccounts();
  document.getElementById("accounts").innerHTML = result;
}

async function getAccountBalanceHandler() {
  await getAccess();
  const acctIdBal = document.getElementById("acctIdBal").value;
  if (!acctIdBal) return;
  const result = await contract.getAccountBalance(acctIdBal);
  document.getElementById("acctBalance").innerHTML = result;
}

async function getAccountOwnersHandler() {
  await getAccess();
  const acctIdOwn = document.getElementById("acctIdOwn").value;
  if (!acctIdOwn) return;
  const result = await contract.getAccountOwners(acctIdOwn);
  document.getElementById("acctOwners").innerHTML = result;
}

async function getApprovalsHandler() {
  console.log("approvals!");
}

async function getIsApprovedHandler() {
  console.log("isApproved!");
}

// const eventLog = document.getElementById("events");
// contract.on("AccountOpened", (id, user, owners) => {
//     eventLog.append(`ID: ${id} USER: ${user}`);
// })
