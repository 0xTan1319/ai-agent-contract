import { ethers, upgrades } from "hardhat";

const adminSigner = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY,
  ethers.provider
);

(async () => {
  try {
    const Factory = await ethers.getContractFactory("AgentRewardV2");
    const contract = await upgrades.upgradeProxy(
      process.env.PERSONA_REWARD,
      Factory
    );
    console.log("AgentRewardV2 upgraded to:", contract.target);
  } catch (e) {
    console.log(e);
  }
})();
