import { ethers } from "hardhat";

(async () => {
  try {
    const nft = await ethers.deployContract("PersonaNft", [process.env.DEPLOYER]);
    console.log("PersonaNft deployed to:", nft.target);
  } catch (e) {
    console.log(e);
  }
})();
