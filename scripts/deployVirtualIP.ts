import { ethers } from "hardhat";

const deployParams = require("./arguments/virtualIPArguments.js");

(async () => {
  try {
    const nft = await ethers.deployContract("VirtualIP", deployParams);
    console.log("VirtualIP deployed to:", nft.target);
  } catch (e) {
    console.log(e);
  }
})();
