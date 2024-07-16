// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./virtualPersona/IAgentNft.sol";

contract AgentInference is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Math for uint256;
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public minFees;
    mapping(uint256 => uint256) public fees; // Agent custom fees
    mapping(uint256 => uint256) public inferenceCount; // Inference count per agent

    IERC20 public token;
    IAgentNft public agentNft;

    event MinFeesUpdated(uint256 minFees);
    event FeesUpdated(uint256 indexed agentId, uint256 fees);
    event Prompt(
        address indexed sender,
        bytes32 promptHash,
        uint256 agentId,
        uint256 cost
    );

    function initialize(
        address defaultAdmin_,
        address token_,
        address agentNft_,
        uint256 minFees_
    ) external initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(ADMIN_ROLE, defaultAdmin_);
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin_);

        token = IERC20(token_);
        minFees = minFees_;
        agentNft = IAgentNft(agentNft_);
    }

    function setFees(
        uint256 agentId,
        uint256 amount
    ) public onlyRole(ADMIN_ROLE) {
        fees[agentId] = amount;
        emit FeesUpdated(agentId, amount);
    }

    function setMinFees(uint256 amount) public onlyRole(ADMIN_ROLE) {
        minFees = amount;
        emit MinFeesUpdated(amount);
    }

    function prompt(
        bytes32 promptHash,
        uint256[] memory agentIds
    ) public nonReentrant {
        address sender = _msgSender();
        uint256 total = 0;

        for (uint256 i = 0; i < agentIds.length; i++) {
            uint256 agentId = agentIds[i];
            uint256 agentFees = fees[agentId].max(minFees);
            total += agentFees;
        }

        require(token.balanceOf(sender) >= total, "Insufficient balance");

        for (uint256 i = 0; i < agentIds.length; i++) {
            uint256 agentId = agentIds[i];
            uint256 agentFees = fees[agentId].max(minFees);
            address agentTba = agentNft.virtualInfo(agentId).tba;
            token.safeTransferFrom(sender, agentTba, agentFees);
            inferenceCount[agentId]++;
            emit Prompt(sender, promptHash, agentId, agentFees);
        }
    }
}
