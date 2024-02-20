// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVirtualIP {
    function isOwned(uint256 tokenId) external view returns (bool);

    function safeMint(address to, uint256 tokenId) external;
}
