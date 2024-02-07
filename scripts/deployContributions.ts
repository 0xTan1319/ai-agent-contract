import { ethers } from "hardhat";

(async () => {
  try {
    const contribution = await ethers.deployContract("ContributionNft", [
      process.env.VIRTUAL_NFT,
    ]);
    console.log("ContributionNft deployed to:", contribution.target);

    const service = await ethers.deployContract("ServiceNft", [
      process.env.VIRTUAL_NFT,
      contribution.target,
    ]);
    console.log("ServiceNft deployed to:", service.target);

    const nft = await ethers.getContractAt(
      "PersonaNft",
      process.env.VIRTUAL_NFT
    );
    await nft.setContributionService(contribution.target, service.target);
  } catch (e) {
    console.log(e);
  }
})();
