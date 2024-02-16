// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract CoreRegistry {
    mapping(uint8 => string) public coreTypes;
    uint8 _nextCoreType;

    event NewCoreType(uint8 coreType, string label);

    constructor() {
        coreTypes[_nextCoreType++] = "Cognitive Core";
        coreTypes[_nextCoreType++] = "Voice and Sound Core";
        coreTypes[_nextCoreType++] = "Visual Core";
        coreTypes[_nextCoreType++] = "Domain Expertise Core";
    }

    function _addCoreType(string memory label) internal  {
        uint8 coreType = _nextCoreType++;
        coreTypes[coreType] = label;
        emit NewCoreType(coreType, label);
    }
}
