import { ethers, upgrades } from "hardhat";

const adminSigner = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY,
  ethers.provider
);

(async () => {
  try {
    const contract = await ethers.deployContract("AgentMigrator", [process.env.VIRTUAL_NFT]);
    await contract.waitForDeployment();
    console.log("AgentMigrator deployed to:", contract.target);

    await contract.setInitParams(process.env.ADMIN, process.env.BRIDGED_TOKEN, process.env.UNISWAP_ROUTER, process.env.VIRTUAL_APPLICATION_THRESHOLD, process.env.MATURITY_DURATION)
    await contract.setTokenSupplyParams(
      process.env.AGENT_TOKEN_LIMIT,
      process.env.AGENT_TOKEN_LP_SUPPLY,
      process.env.AGENT_TOKEN_VAULT_SUPPLY,
      process.env.AGENT_TOKEN_LIMIT,
      process.env.AGENT_TOKEN_LIMIT,
      process.env.BOT_PROTECTION,
      process.env.MINTER
    );
    await contract.setTokenTaxParams(
      process.env.TAX,
      process.env.TAX,
      process.env.SWAP_THRESHOLD,
      process.env.TAX_VAULT
    );
    await contract.setImplementations(
      process.env.VIRTUAL_TOKEN_IMPL,
      process.env.VIRTUAL_VETOKEN_IMPL,
      process.env.VIRTUAL_DAO_IMPL
    );

    const nft = await ethers.getContractAt("AgentNftV2", process.env.VIRTUAL_NFT, adminSigner);
    await nft.grantRole(await nft.ADMIN_ROLE(), contract.target);
  } catch (e) {
    console.log(e);
  }
})();
