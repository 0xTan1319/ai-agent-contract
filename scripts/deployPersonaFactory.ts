import { ethers, upgrades } from "hardhat";

(async () => {
  try {
    const PersonaFactory = await ethers.getContractFactory("PersonaFactory");
    const factory = await upgrades.deployProxy(PersonaFactory, [
      process.env.VIRTUAL_TOKEN_IMPL,
      process.env.VIRTUAL_DAO_IMPL,
      process.env.TBA,
      process.env.ASSET_TOKEN,
      process.env.VIRTUAL_NFT,
      process.env.PROTOCOL_DAO,
      ethers.parseEther(process.env.VIRTUAL_PROPOSAL_THRESHOLD),
      process.env.MATURITY_DURATION,
    ]);
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
