import { ethers, upgrades } from "hardhat";

(async () => {
  try {
    const PersonaFactory = await ethers.getContractFactory("PersonaFactory");
    const factory = await upgrades.upgradeProxy(
      process.env.VIRTUAL_FACTORY,
      PersonaFactory
    );
    console.log("Upgraded", factory.target);
  } catch (e) {
    console.log(e);
  }
})();
