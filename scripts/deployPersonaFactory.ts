import { ethers, upgrades } from "hardhat";
const deployParams = require("./arguments/personaFactoryArguments.js");

(async () => {
  try {
    const PersonaFactory = await ethers.getContractFactory("PersonaFactory");
    const factory = await upgrades.deployProxy(PersonaFactory, deployParams);
    await factory.waitForDeployment();

    console.log("PersonaFactory deployed to:", factory.target);

    // Grant factory to mint NFTs
    const PersonaNft = await ethers.getContractFactory("PersonaNft");
    const nft = PersonaNft.attach(process.env.VIRTUAL_NFT);

    await nft.grantRole(ethers.id("MINTER_ROLE"), factory.target);
    
  } catch (e) {
    console.log(e);
  }
})();
