import { ethers } from "hardhat";

(async () => {
  try {
    const dao = await ethers.deployContract("PersonaDAO");
    console.log("PersonaDAO deployed to:", dao.target);

    const token = await ethers.deployContract("PersonaToken");
    console.log("PersonaToken deployed to:", token.target);
  } catch (e) {
    console.log(e);
  }
})();
