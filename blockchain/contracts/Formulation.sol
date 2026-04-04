// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SupplyChain.sol";

/**
 * @title Formulation
 * @dev Records product formulations created by manufacturers.
 *      Inherits SupplyChain.
 */
contract Formulation is SupplyChain {

    struct HerbComponent {
        string herbName;
        uint256 percentage; // E.g. 50 meaning 50%
    }

    struct ProductFormulation {
        bytes32 formulationId;
        string productName;
        string dosage;
        address manufacturer;
        uint256 timestamp;
        string ipfsHash;    // IPFS CID for detailed recipe or compliance docs
    }

    // Mapping from formulationId to the Formulation
    mapping(bytes32 => ProductFormulation) public formulations;
    // Mapping from formulationId to the array of HerbComponents
    mapping(bytes32 => HerbComponent[]) public formulationComponents;

    bytes32[] public allFormulationIds;

    event FormulationCreated(
        bytes32 indexed formulationId,
        string productName,
        address indexed manufacturer,
        uint256 timestamp
    );

    /**
     * @dev Restricts function to accounts with MANUFACTURER_ROLE.
     */
    modifier onlyManufacturer() {
        require(
            hasRole(MANUFACTURER_ROLE, msg.sender),
            "Formulation: caller is not a manufacturer"
        );
        _;
    }

    /**
     * @notice Create a new formulation bridging multiple herbs.
     * @dev We use arrays to pass in the components.
     *      Returns the newly created formulationId.
     */
    function recordFormulation(
        string calldata productName,
        string calldata dosage,
        string[] calldata herbNames,
        uint256[] calldata percentages,
        string calldata ipfsHash
    ) external onlyManufacturer returns (bytes32 formulationId) {
        require(bytes(productName).length > 0, "Formulation: product name required");
        require(herbNames.length == percentages.length, "Formulation: array length mismatch");
        require(herbNames.length > 0, "Formulation: requires at least one herb");

        uint256 totalPercentage = 0;
        for(uint i = 0; i < percentages.length; i++) {
            totalPercentage += percentages[i];
        }
        require(totalPercentage == 100, "Formulation: total percentage must be 100");

        formulationId = keccak256(
            abi.encodePacked(
                msg.sender,
                productName,
                block.timestamp,
                block.prevrandao
            )
        );

        require(formulations[formulationId].timestamp == 0, "Formulation: ID collision");

        formulations[formulationId] = ProductFormulation({
            formulationId: formulationId,
            productName: productName,
            dosage: dosage,
            manufacturer: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash
        });

        allFormulationIds.push(formulationId);

        for(uint i = 0; i < herbNames.length; i++) {
            formulationComponents[formulationId].push(HerbComponent({
                herbName: herbNames[i],
                percentage: percentages[i]
            }));
        }

        emit FormulationCreated(formulationId, productName, msg.sender, block.timestamp);

        return formulationId;
    }

    function getFormulation(bytes32 formulationId) external view returns (ProductFormulation memory) {
        return formulations[formulationId];
    }

    function getFormulationComponents(bytes32 formulationId) external view returns (HerbComponent[] memory) {
        return formulationComponents[formulationId];
    }
}
