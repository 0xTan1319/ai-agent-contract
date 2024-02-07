// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IServiceNft {
    function getCore(uint256 tokenId) external view returns (uint8);

    function getMaturity(uint256 tokenId) external view returns (uint16);

    function getImpact(uint256 tokenId) external view returns (uint16);

    function getCoreService(
        uint256 virtualId,
        uint8 coreType
    ) external view returns (uint256);

    event CoreServiceUpdated(
        uint256 virtualId,
        uint8 coreType,
        uint256 serviceId
    );

    function getCoreDatasetAt(
        uint256 virtualId,
        uint8 coreType,
        uint256 index
    ) external view returns (uint256);

    function totalCoreDatasets(
        uint256 virtualId,
        uint8 coreType
    ) external view returns (uint256);

    function getCoreDatasets(
        uint256 virtualId,
        uint8 coreType
    ) external view returns (uint256[] memory);

    function getMintedAt(uint256 tokenId) external view returns (uint256);
}
