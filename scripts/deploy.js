const hre = require("hardhat");
const fs = require("fs/promises");

async function main() {
  const JointAccount = await hre.ethers.getContractFactory("JointAccount");
  const jointAccount = await JointAccount.deploy();
  await jointAccount.deployed();
  await writeDeploymentInfo(jointAccount);
}

async function writeDeploymentInfo(contract) {
  const data = {
    contract: {
      address: contract.address,
      signerAddress: contract.signer.address,
      abi: contract.interface.format(),
    },
  };
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile("deployment.json", content, { encoding: "utf-8" });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
