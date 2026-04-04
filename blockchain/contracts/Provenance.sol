// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Formulation.sol";

/**
 * @title Provenance
 * @dev The top-level contract of the Ayurvedic herb supply chain system.
 *      Provides a single `getBatchProvenance` function that returns the complete
 *      history of any batch — designed for consumer QR code verification.
 *
 *      Inheritance chain:
 *      Provenance → Formulation → SupplyChain → QualityTest → Processing → HerbBatch → RoleManager → AccessControl
 *
 *      Deployment: Deploy only this contract — it includes all functionality.
 */
contract Provenance is Formulation {

    // ─── Structs ─────────────────────────────────────────────────────────────

    /**
     * @dev Aggregated provenance data returned to consumers or frontend apps.
     *      Bundles all records associated with a single batch for easy consumption.
     */
    struct BatchProvenance {
        // Core batch info
        bytes32 batchId;
        string herbName;
        string geoLatitude;
        string geoLongitude;
        uint256 harvestDate;
        bool isSustainable;
        address currentOwner;
        address collector;

        // Collection details
        CollectionEvent collectionEvent;

        // Full processing history
        ProcessingStep[] processingSteps;

        // Full quality test history
        QualityTestRecord[] qualityTests;

        // Full transfer history
        TransferRecord[] transfers;

        // Computed flags
        bool hasPassedLatestQualityTest;
        uint256 provenanceQueriedAt; // Timestamp of when this query was made
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    event ProvenanceQueried(
        bytes32 indexed batchId,
        address indexed queriedBy,
        uint256 timestamp
    );

    // ─── Public Query Functions ───────────────────────────────────────────────

    /**
     * @notice Retrieve the complete provenance history of a herb batch.
     */
    function getBatchProvenance(bytes32 batchId)
        external
        batchExists(batchId)
        returns (BatchProvenance memory prov)
    {
        Batch storage b = batches[batchId];

        prov.batchId        = b.batchId;
        prov.herbName       = b.herbName;
        prov.geoLatitude    = b.geoLatitude;
        prov.geoLongitude   = b.geoLongitude;
        prov.harvestDate    = b.harvestDate;
        prov.isSustainable  = b.isSustainable;
        prov.currentOwner   = b.currentOwner;
        prov.collector      = b.collector;

        prov.collectionEvent   = b.collection;
        prov.processingSteps   = processingSteps[batchId];
        prov.qualityTests      = qualityTests[batchId];
        prov.transfers         = transferHistory[batchId];

        // Set quality flag only if at least one test exists
        prov.hasPassedLatestQualityTest =
            qualityTests[batchId].length > 0 && latestTestPassed[batchId];

        prov.provenanceQueriedAt = block.timestamp;

        emit ProvenanceQueried(batchId, msg.sender, block.timestamp);

        return prov;
    }

    /**
     * @notice View-only version of getBatchProvenance (no state change, no event).
     */
    function viewBatchProvenance(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (BatchProvenance memory prov)
    {
        Batch storage b = batches[batchId];

        prov.batchId        = b.batchId;
        prov.herbName       = b.herbName;
        prov.geoLatitude    = b.geoLatitude;
        prov.geoLongitude   = b.geoLongitude;
        prov.harvestDate    = b.harvestDate;
        prov.isSustainable  = b.isSustainable;
        prov.currentOwner   = b.currentOwner;
        prov.collector      = b.collector;

        prov.collectionEvent   = b.collection;
        prov.processingSteps   = processingSteps[batchId];
        prov.qualityTests      = qualityTests[batchId];
        prov.transfers         = transferHistory[batchId];

        prov.hasPassedLatestQualityTest =
            qualityTests[batchId].length > 0 && latestTestPassed[batchId];

        prov.provenanceQueriedAt = block.timestamp;

        return prov;
    }

    /**
     * @notice Quick summary of a batch for lightweight QR displays.
     */
    function getBatchSummary(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (
            string memory herbName,
            address collector,
            uint256 harvestDate,
            bool isSustainable,
            bool qualityApproved,
            uint256 processingCount,
            uint256 transferCount
        )
    {
        Batch storage b = batches[batchId];
        return (
            b.herbName,
            b.collector,
            b.harvestDate,
            b.isSustainable,
            qualityTests[batchId].length > 0 && latestTestPassed[batchId],
            processingSteps[batchId].length,
            transferHistory[batchId].length
        );
    }

    /**
     * @notice Returns all batch IDs ever created.
     */
    function getAllBatchIds() external view returns (bytes32[] memory) {
        return allBatchIds;
    }

    /**
     * @notice Returns all formulation IDs ever created.
     */
    function getAllFormulationIds() external view returns (bytes32[] memory) {
        return allFormulationIds;
    }
}
