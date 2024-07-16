/*
Test delegation with history
*/
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { keccak256 } = require("ethers/crypto");
const { parseEther, toBeHex, formatEther } = require("ethers/utils");
const {
  loadFixture,
  mine,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("AgentInference", function () {
  const PROPOSAL_THRESHOLD = parseEther("50000"); // 50k
  const MIN_FEES = parseEther("1");

  const genesisInput = {
    name: "Jessica",
    symbol: "JSC",
    tokenURI: "http://jessica",
    daoName: "Jessica DAO",
    cores: [0, 1, 2],
    tbaSalt:
      "0xa7647ac9429fdce477ebd9a95510385b756c757c26149e740abbab0ad1be2f16",
    tbaImplementation: process.env.TBA_IMPLEMENTATION,
    daoVotingPeriod: 600,
    daoThreshold: 1000000000000000000000n,
  };

  before(async function () {
    const signers = await ethers.getSigners();
    this.accounts = signers.map((signer) => signer.address);
    this.signers = signers;
  });

  const getAccounts = async () => {
    const [deployer, ipVault, founder, user, trader, treasury] =
      await ethers.getSigners();
    return { deployer, ipVault, founder, user, trader, treasury };
  };

  async function deployBaseContracts() {
    const { deployer, ipVault, treasury } = await getAccounts();

    const virtualToken = await ethers.deployContract(
      "VirtualToken",
      [PROPOSAL_THRESHOLD, deployer.address],
      {}
    );
    await virtualToken.waitForDeployment();

    const AgentNft = await ethers.getContractFactory("AgentNftV2");
    const agentNft = await upgrades.deployProxy(AgentNft, [deployer.address]);

    const contribution = await upgrades.deployProxy(
      await ethers.getContractFactory("ContributionNft"),
      [agentNft.target],
      {}
    );

    const service = await upgrades.deployProxy(
      await ethers.getContractFactory("ServiceNft"),
      [agentNft.target, contribution.target, process.env.DATASET_SHARES],
      {}
    );

    await agentNft.setContributionService(contribution.target, service.target);

    // Implementation contracts
    const agentToken = await ethers.deployContract("AgentToken");
    await agentToken.waitForDeployment();
    const agentDAO = await ethers.deployContract("AgentDAO");
    await agentDAO.waitForDeployment();
    const agentVeToken = await ethers.deployContract("AgentVeToken");
    await agentVeToken.waitForDeployment();

    const agentFactory = await upgrades.deployProxy(
      await ethers.getContractFactory("AgentFactoryV2"),
      [
        agentToken.target,
        agentVeToken.target,
        agentDAO.target,
        process.env.TBA_REGISTRY,
        virtualToken.target,
        agentNft.target,
        PROPOSAL_THRESHOLD,
        deployer.address,
      ]
    );
    await agentFactory.waitForDeployment();
    await agentNft.grantRole(await agentNft.MINTER_ROLE(), agentFactory.target);
    const minter = await upgrades.deployProxy(
      await ethers.getContractFactory("Minter"),
      [
        service.target,
        contribution.target,
        agentNft.target,
        process.env.IP_SHARES,
        process.env.IMPACT_MULTIPLIER,
        ipVault.address,
        agentFactory.target,
        deployer.address,
        process.env.MAX_IMPACT,
      ]
    );
    await minter.waitForDeployment();
    await agentFactory.setMaturityDuration(86400 * 365 * 10); // 10years
    await agentFactory.setUniswapRouter(process.env.UNISWAP_ROUTER);
    await agentFactory.setTokenAdmin(deployer.address);
    await agentFactory.setTokenSupplyParams(
      process.env.AGENT_TOKEN_LIMIT,
      process.env.AGENT_TOKEN_LP_SUPPLY,
      process.env.AGENT_TOKEN_VAULT_SUPPLY,
      process.env.AGENT_TOKEN_LIMIT,
      process.env.AGENT_TOKEN_LIMIT,
      process.env.BOT_PROTECTION,
      minter.target
    );
    await agentFactory.setTokenTaxParams(
      process.env.TAX,
      process.env.TAX,
      process.env.SWAP_THRESHOLD,
      treasury.address
    );

    const InferenceContract = await ethers.getContractFactory("AgentInference");
    const inference = (contract = await upgrades.deployProxy(
      InferenceContract,
      [deployer.address, virtualToken.target, agentNft.target, MIN_FEES]
    ));

    return { virtualToken, agentFactory, agentNft, inference };
  }

  async function deployWithApplication() {
    const base = await deployBaseContracts();
    const { agentFactory, virtualToken } = base;
    const { founder } = await getAccounts();

    // Prepare tokens for proposal
    await virtualToken.mint(founder.address, PROPOSAL_THRESHOLD);
    await virtualToken
      .connect(founder)
      .approve(agentFactory.target, PROPOSAL_THRESHOLD);

    const tx = await agentFactory
      .connect(founder)
      .proposeAgent(
        genesisInput.name,
        genesisInput.symbol,
        genesisInput.tokenURI,
        genesisInput.cores,
        genesisInput.tbaSalt,
        genesisInput.tbaImplementation,
        genesisInput.daoVotingPeriod,
        genesisInput.daoThreshold
      );

    const filter = agentFactory.filters.NewApplication;
    const events = await agentFactory.queryFilter(filter, -1);
    const event = events[0];
    const { id } = event.args;
    return { applicationId: id, ...base };
  }

  async function deployWithAgent() {
    const base = await deployWithApplication();
    const { agentFactory, applicationId } = base;

    const { founder } = await getAccounts();
    await agentFactory
      .connect(founder)
      .executeApplication(applicationId, false);

    const factoryFilter = agentFactory.filters.NewPersona;
    const factoryEvents = await agentFactory.queryFilter(factoryFilter, -1);
    const factoryEvent = factoryEvents[0];

    const { virtualId, token, veToken, dao, tba, lp } = await factoryEvent.args;

    return {
      ...base,
      agent: {
        virtualId,
        token,
        veToken,
        dao,
        tba,
        lp,
      },
    };
  }

  before(async function () {
    const signers = await ethers.getSigners();
    this.accounts = signers.map((signer) => signer.address);
    this.signers = signers;
  });

  it("should transfer token to provider", async function () {
    const { agent, inference, virtualToken } = await loadFixture(
      deployWithAgent
    );

    const { user } = await getAccounts();
    // Prepare funds for user
    await virtualToken.transfer(user.address, parseEther("1000"));
    expect(await virtualToken.balanceOf(user.address)).to.be.equal(
      parseEther("1000")
    );
    expect(await virtualToken.balanceOf(agent.tba)).to.be.equal(
      parseEther("0")
    );

    await virtualToken
      .connect(user)
      .approve(inference.target, parseEther("1000000000"));

    // // Start inference
    const hash = keccak256(ethers.toUtf8Bytes("hello world!"));
    await expect(inference.connect(user).prompt(hash, [1])).to.be.emit(
      contract,
      "Prompt"
    );
    expect(await virtualToken.balanceOf(user.address)).to.be.equal(
      parseEther("999")
    );
    expect(await virtualToken.balanceOf(agent.tba)).to.be.equal(
      parseEther("1")
    );
  });

  it("should be able to customize fees per provider", async function () {
    const { agent, inference, virtualToken } = await loadFixture(
      deployWithAgent
    );

    const { user } = await getAccounts();
    // Prepare funds for user
    await virtualToken.transfer(user.address, parseEther("1000"));
    expect(await virtualToken.balanceOf(user.address)).to.be.equal(
      parseEther("1000")
    );
    expect(await virtualToken.balanceOf(agent.tba)).to.be.equal(
      parseEther("0")
    );

    await virtualToken
      .connect(user)
      .approve(inference.target, parseEther("1000000000"));

    await expect(inference.setFees(1, parseEther("3"))).to.be.emit(
      inference,
      "FeesUpdated"
    );

    // Start inference
    const hash = keccak256(ethers.toUtf8Bytes("hello world!"));
    await expect(inference.connect(user).prompt(hash, [1])).to.be.emit(
      contract,
      "Prompt"
    );
    expect(await virtualToken.balanceOf(user.address)).to.be.equal(
      parseEther("997")
    );
    expect(await virtualToken.balanceOf(agent.tba)).to.be.equal(
      parseEther("3")
    );
  });

  it("should be able to prompt for 2 agents", async function () {
    const { agent, inference, virtualToken, agentFactory } = await loadFixture(
      deployWithAgent
    );

    // Prepare agent 2
    const { founder, user } = await getAccounts();

    // Prepare tokens for proposal
    await virtualToken.mint(founder.address, PROPOSAL_THRESHOLD);
    await virtualToken
      .connect(founder)
      .approve(agentFactory.target, PROPOSAL_THRESHOLD);
    // Prepare tokens for proposal
    await virtualToken.mint(founder.address, PROPOSAL_THRESHOLD);
    await virtualToken
      .connect(founder)
      .approve(agentFactory.target, PROPOSAL_THRESHOLD);

    const tx = await agentFactory
      .connect(founder)
      .proposeAgent(
        genesisInput.name,
        genesisInput.symbol,
        genesisInput.tokenURI,
        genesisInput.cores,
        genesisInput.tbaSalt,
        genesisInput.tbaImplementation,
        genesisInput.daoVotingPeriod,
        genesisInput.daoThreshold
      );
    const filter = agentFactory.filters.NewApplication;
    const events = await agentFactory.queryFilter(filter, -1);
    const event = events[0];
    const { id } = event.args;
    await agentFactory.connect(founder).executeApplication(id, false);
    const factoryFilter = agentFactory.filters.NewPersona;
    const factoryEvents = await agentFactory.queryFilter(factoryFilter, -1);
    const factoryEvent = factoryEvents[0];

    const { tba } = await factoryEvent.args;

    await virtualToken.transfer(user.address, parseEther("1000"));
    await virtualToken
      .connect(user)
      .approve(inference.target, parseEther("1000000000"));

    // Start inference
    const hash = keccak256(ethers.toUtf8Bytes("hello world!"));
    await expect(inference.connect(user).prompt(hash, [1, 2])).to.be.emit(
      contract,
      "Prompt"
    );
    expect(await virtualToken.balanceOf(user.address)).to.be.equal(
      parseEther("998")
    );
    expect(await virtualToken.balanceOf(agent.tba)).to.be.equal(
      parseEther("1")
    );
    expect(await virtualToken.balanceOf(tba)).to.be.equal(parseEther("1"));
  });
});
