const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("JointAccount", function () {
  async function deployJointAccount() {
    const [user1, user2, user3, user4, user5] = await ethers.getSigners();
    const JointAccount = await ethers.getContractFactory("JointAccount");
    const jointAccount = await JointAccount.deploy();
    return { jointAccount, user1, user2, user3, user4, user5 };
  }

  async function deployWithWithdrawRequests(
    owners = 1,
    deposit = 0,
    withdrawAmounts = []
  ) {
    const { jointAccount, user1, user2, user3, user4, user5 } =
      await loadFixture(deployJointAccount);
    if (owners == 1) {
      await jointAccount.connect(user1).openAccount([]);
    } else if (owners == 2) {
      await jointAccount.connect(user1).openAccount([user2.address]);
    } else if (owners == 3) {
      await jointAccount
        .connect(user1)
        .openAccount([user2.address, user3.address]);
    } else if (owners == 4) {
      await jointAccount
        .connect(user1)
        .openAccount([user2.address, user3.address, user4.address]);
    }
    if (deposit > 0) {
      await jointAccount
        .connect(user1)
        .deposit(0, { value: deposit.toString() });
    }
    for (const withdrawAmount of withdrawAmounts) {
      await jointAccount.connect(user1).requestWithdraw(0, withdrawAmount);
    }
    return { jointAccount, user1, user2, user3, user4, user5 };
  }

  describe("Deployment", function () {
    it("should deploy without error", async function () {
      await loadFixture(deployJointAccount);
    });

    it("should deploy with withdrawRequests without error", async function () {
      await loadFixture(deployWithWithdrawRequests);
    });
  });

  describe("Open Account", function () {
    it("should open a single user account", async function () {
      const { jointAccount, user1 } = await loadFixture(deployJointAccount);
      await jointAccount.connect(user1).openAccount([]);
      const userAccounts1 = await jointAccount.connect(user1).getUserAccounts();
      expect(userAccounts1.length).to.equal(1);
    });

    it("should open a two-user account", async function () {
      const { jointAccount, user1, user2 } = await loadFixture(
        deployJointAccount
      );
      await jointAccount.connect(user1).openAccount([user2.address]);
      const userAccounts1 = await jointAccount.connect(user1).getUserAccounts();
      expect(userAccounts1.length).to.equal(1);
      const userAccounts2 = await jointAccount.connect(user2).getUserAccounts();
      expect(userAccounts2.length).to.equal(1);
      const accountOwners = await jointAccount
        .connect(user1)
        .getAccountOwners(0);
      expect(accountOwners.length).to.equal(2);
    });

    it("should open a three-user account", async function () {
      const { jointAccount, user1, user2, user3 } = await loadFixture(
        deployJointAccount
      );
      await jointAccount
        .connect(user1)
        .openAccount([user2.address, user3.address]);
      const userAccounts1 = await jointAccount.connect(user1).getUserAccounts();
      expect(userAccounts1.length).to.equal(1);
      const userAccounts2 = await jointAccount.connect(user2).getUserAccounts();
      expect(userAccounts2.length).to.equal(1);
      const userAccounts3 = await jointAccount.connect(user3).getUserAccounts();
      expect(userAccounts3.length).to.equal(1);
      const accountOwners = await jointAccount
        .connect(user1)
        .getAccountOwners(0);
      expect(accountOwners.length).to.equal(3);
    });

    it("should open a four-user account", async function () {
      const { jointAccount, user1, user2, user3, user4 } = await loadFixture(
        deployJointAccount
      );
      await jointAccount
        .connect(user1)
        .openAccount([user2.address, user3.address, user4.address]);
      const userAccounts1 = await jointAccount.connect(user1).getUserAccounts();
      expect(userAccounts1.length).to.equal(1);
      const userAccounts2 = await jointAccount.connect(user2).getUserAccounts();
      expect(userAccounts2.length).to.equal(1);
      const userAccounts3 = await jointAccount.connect(user3).getUserAccounts();
      expect(userAccounts3.length).to.equal(1);
      const userAccounts4 = await jointAccount.connect(user4).getUserAccounts();
      expect(userAccounts4.length).to.equal(1);
      const accountOwners = await jointAccount
        .connect(user1)
        .getAccountOwners(0);
      expect(accountOwners.length).to.equal(4);
    });

    it("should not open a five-user account", async function () {
      const { jointAccount, user1, user2, user3, user4, user5 } =
        await loadFixture(deployJointAccount);
      await expect(
        jointAccount
          .connect(user1)
          .openAccount([
            user2.address,
            user3.address,
            user4.address,
            user5.address,
          ])
      ).to.be.reverted;
    });

    it("should not open account with duplicated owners", async function () {
      const { jointAccount, user1 } = await loadFixture(deployJointAccount);
      await expect(jointAccount.connect(user1).openAccount([user1.address])).to
        .be.reverted;
    });

    it("should not allow one user own more than 3 accounts", async function () {
      const { jointAccount, user1 } = await loadFixture(deployJointAccount);
      for (let i = 0; i < 3; i++) {
        await jointAccount.connect(user1).openAccount([]);
      }
      await expect(jointAccount.connect(user1).openAccount([])).to.be.reverted;
    });
  });

  describe("Deposit", function () {
    it("should allow deposit from a owner", async function () {
      const { jointAccount, user1 } = await loadFixture(deployJointAccount);
      await jointAccount.connect(user1).openAccount([]);
      await expect(
        jointAccount.connect(user1).deposit(0, { value: "100" })
      ).to.changeEtherBalances([jointAccount, user1], ["100", "-100"]);
    });

    it("should not allow deposit from a non-owner", async function () {
      const { jointAccount, user1, user2 } = await loadFixture(
        deployJointAccount
      );
      await jointAccount.connect(user1).openAccount([]);
      await expect(jointAccount.connect(user2).deposit(0, { value: "100" })).to
        .be.reverted;
    });

    it("Should emit an event on deposit", async function () {
      const { jointAccount, user1 } = await loadFixture(deployJointAccount);
      await jointAccount.connect(user1).openAccount([]);
      await expect(
        jointAccount.connect(user1).deposit(0, { value: "100" })
      ).to.emit(jointAccount, "Deposited");
    });
  });

  describe("Request a Withdrawal", function () {
    it("should allow owner request a withdrawal", async function () {
      const { jointAccount, user1 } = await loadFixture(deployJointAccount);
      await jointAccount.connect(user1).openAccount([]);
      await jointAccount.connect(user1).deposit(0, { value: "100" });
      await jointAccount.connect(user1).requestWithdraw(0, 100);
    });

    it("should not allow non-owner to request a withdrawal", async function () {
      const { jointAccount, user1, user2 } = await loadFixture(
        deployJointAccount
      );
      await jointAccount.connect(user1).openAccount([]);
      await jointAccount.connect(user1).deposit(0, { value: "100" });
      await expect(jointAccount.connect(user2).requestWithdraw(0, 100)).to.be
        .reverted;
    });

    it("should not allow owner to request a withdrawal larger than the balance", async function () {
      const { jointAccount, user1, user2 } = await loadFixture(
        deployJointAccount
      );
      await jointAccount.connect(user1).openAccount([]);
      await jointAccount.connect(user1).deposit(0, { value: "100" });
      await expect(jointAccount.connect(user1).requestWithdraw(0, 101)).to.be
        .reverted;
    });
  });

  describe("Approve a Withdrawal Request", function () {
    it("should allow other owners to approve a withdrawal request", async function () {
      const { jointAccount, user2 } = await deployWithWithdrawRequests(2, 100, [
        100,
      ]);
      await jointAccount.connect(user2).approveWithdraw(0, 0);
      expect(await jointAccount.getApprovals(0, 0)).to.equal(1);
    });

    it("should not allow other owners to approve an approved withdrawal request", async function () {
      const { jointAccount, user2 } = await deployWithWithdrawRequests(2, 100, [
        100,
      ]);
      await jointAccount.connect(user2).approveWithdraw(0, 0);
      expect(await jointAccount.getIsApproved(0, 0)).to.equal(true);
      await expect(jointAccount.connect(user2).approveWithdraw(0, 0)).to.be
        .reverted;
    });

    it("should not allow the owner who requested to approve a withdrawal request", async function () {
      const { jointAccount, user1 } = await deployWithWithdrawRequests(2, 100, [
        100,
      ]);
      await expect(jointAccount.connect(user1).approveWithdraw(0, 0)).to.be
        .reverted;
    });

    it("should not allow non-owner to approve a withdrawal request", async function () {
      const { jointAccount, user3 } = await deployWithWithdrawRequests(2, 100, [
        100,
      ]);
      await expect(jointAccount.connect(user3).approveWithdraw(0, 0)).to.be
        .reverted;
    });

    it("should not allow other owners to approve a withdrawal request twice", async function () {
      const { jointAccount, user2 } = await deployWithWithdrawRequests(3, 100, [
        100,
      ]);
      await jointAccount.connect(user2).approveWithdraw(0, 0);
      await expect(jointAccount.connect(user2).approveWithdraw(0, 0)).to.be
        .reverted;
    });

    it("should not allow other owners to approve a non-existing withdrawal request", async function () {
      const { jointAccount, user2 } = await deployWithWithdrawRequests(2, 100, [
        100,
      ]);
      await expect(jointAccount.connect(user2).approveWithdraw(0, 1)).to.be
        .reverted;
    });
  });

  describe("Withdraw", function () {
    it("should allow the owner who requested to withdraw an approved request", async function () {
      const { jointAccount, user1, user2 } = await deployWithWithdrawRequests(
        2,
        100,
        [100]
      );
      await jointAccount.connect(user2).approveWithdraw(0, 0);
      await expect(
        jointAccount.connect(user1).withdraw(0, 0)
      ).to.changeEtherBalances([jointAccount, user1], ["-100", "100"]);
    });

    it("should not allow the owner who requested to withdraw an approved request twice", async function () {
      const { jointAccount, user1, user2 } = await deployWithWithdrawRequests(
        2,
        100,
        [100]
      );
      await jointAccount.connect(user2).approveWithdraw(0, 0);
      await jointAccount.connect(user1).withdraw(0, 0);
      await expect(jointAccount.connect(user1).withdraw(0, 0)).to.be.reverted;
    });

    it("should not allow the owner who didn't request to withdraw", async function () {
      const { jointAccount, user2 } = await deployWithWithdrawRequests(2, 100, [
        100,
      ]);
      await jointAccount.connect(user2).approveWithdraw(0, 0);
      await expect(jointAccount.connect(user2).withdraw(0, 0)).to.be.reverted;
    });

    it("should not allow the owner to withdraw an unapproved request", async function () {
      const { jointAccount, user1 } = await deployWithWithdrawRequests(2, 100, [
        100,
      ]);
      await expect(jointAccount.connect(user1).withdraw(0, 0)).to.be.reverted;
    });

    it("Should emit an event on withdrawals", async function () {
      const { jointAccount, user1, user2 } = await deployWithWithdrawRequests(
        2,
        100,
        [100]
      );
      await jointAccount.connect(user2).approveWithdraw(0, 0);
      await expect(jointAccount.connect(user1).withdraw(0, 0)).to.emit(
        jointAccount,
        "Withdrew"
      );
    });
  });
});
