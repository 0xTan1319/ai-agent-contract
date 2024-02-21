// SPDX-License-Identifier: MIT
// This DAO allows early execution of proposal as soon as quorum is reached
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorStorage.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "./GovernorCountingSimple.sol";

contract VirtualGenesisDAO is
    Governor,
    GovernorSettings,
    GovernorStorage,
    GovernorVotes,
    GovernorCountingSimple
{
    mapping(uint256 => bool) _earlyExecutions;

    constructor(
        IVotes token,
        uint48 initialVotingDelay,
        uint32 initialVotingPeriod,
        uint256 initialProposalThreshold
    )
        Governor("VirtualGenesis")
        GovernorSettings(
            initialVotingDelay,
            initialVotingPeriod,
            initialProposalThreshold
        )
        GovernorVotes(token)
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal override(Governor, GovernorStorage) returns (uint256) {
        return
            super._propose(targets, values, calldatas, description, proposer);
    }

    function quorum(
        uint256 blockNumber
    ) public pure override returns (uint256) {
        return 10000e18;
    }

    function earlyExecute(uint256 proposalId) public payable returns (uint256) {
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            bytes32 descriptionHash
        ) = proposalDetails(proposalId);

        require(
            state(proposalId) == ProposalState.Active &&
                _quorumReached(proposalId) &&
                !_earlyExecutions[proposalId],
            "Proposal not ready for early execution"
        );
        // avoid reentrancy
        _earlyExecutions[proposalId] = true;

        _executeOperations(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );

        emit ProposalExecuted(proposalId);

        return proposalId;
    }

    // Handle early execution
    function state(uint256 proposalId) public view override returns (ProposalState) {
        if (_earlyExecutions[proposalId]) {
            return ProposalState.Executed;
        }
        return super.state(proposalId);
    }
}
