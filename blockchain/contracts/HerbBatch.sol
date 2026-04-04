// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";

/**
 * @title HerbBatch
 * @dev Manages the creation and lifecycle of Ayurvedic herb batches.
 *      Each batch represents a unique harvest lot from a collector/farmer.
 *      Inherits RoleManager for access control.
 */
contract HerbBatch is RoleManager {

    // ─── Structs ─────────────────────────────────────────────────────────────

    /**
     * @dev Represents a collection event at the point of harvest.
     *      Stores GPS coordinates, timing, environmental data, and IPFS documentation.
     */
    struct CollectionEvent {
        string gpsLatitude;        // Latitude of harvest location (e.g., "22.7196")
        string gpsLongitude;       // Longitude of harvest location (e.g., "75.8577")
        uint256 timestamp;         // Unix timestamp of collection
        address collectorAddress;  // Wallet address of the farmer/collector
        string herbSpecies;        // Scientific name of the herb species
        uint256 quantity;          // Collected quantity
        string unit;               // Unit of measurement (e.g., kg, g)
        string weather;            // Weather conditions during harvest
        int256 temperature;        // Temperature in Celsius
        string initialQuality;     // Freeform initial quality description
        string ipfsHash;           // IPFS CID for photos or additional metadata
    }

    /**
     * @dev Core data structure for each herb batch.
     */
    struct Batch {
        bytes32 batchId;           // Unique identifier for this batch
        string herbName;           // Common name of the herb
        address collector;         // Address of the farmer who harvested
        string geoLatitude;        // Harvest geo-location latitude
        string geoLongitude;       // Harvest geo-location longitude
        uint256 harvestDate;       // Unix timestamp of harvest
        bool isSustainable;        // Whether harvested sustainably
        address currentOwner;      // Current custodian in the supply chain
        bool exists;               // Guard flag to check existence
        CollectionEvent collection; // Collection details
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    /// @dev Maps batchId → Batch struct
    mapping(bytes32 => Batch) public batches;

    /// @dev List of all batch IDs created (for enumeration)
    bytes32[] public allBatchIds;

    // ─── Events ──────────────────────────────────────────────────────────────

    event BatchCreated(
        bytes32 indexed batchId,
        string herbName,
        address indexed collector,
        uint256 harvestDate,
        bool isSustainable
    );

    event CollectionRecorded(
        bytes32 indexed batchId,
        address indexed collector,
        string herbSpecies,
        uint256 timestamp
    );

    // ─── Modifiers ───────────────────────────────────────────────────────────

    /**
     * @dev Ensures the batch with given ID exists.
     */
    modifier batchExists(bytes32 batchId) {
        require(batches[batchId].exists, "HerbBatch: batch does not exist");
        _;
    }

    /**
     * @dev Ensures the caller has the COLLECTOR_ROLE.
     */
    modifier onlyCollector() {
        require(hasRole(COLLECTOR_ROLE, msg.sender), "HerbBatch: caller is not a collector");
        _;
    }

    // ─── Functions ───────────────────────────────────────────────────────────

    /**
     * @notice Create a new herb batch at the point of collection.
     * @dev Only accounts with COLLECTOR_ROLE can call this.
     *      Generates a unique batchId using keccak256 of parameters + block data.
     */
    function createBatch(
        string calldata herbName,
        string calldata geoLatitude,
        string calldata geoLongitude,
        uint256 harvestDate,
        bool isSustainable,
        string calldata herbSpecies,
        uint256 quantity,
        string calldata unit,
        string calldata weather,
        int256 temperature,
        string calldata initialQuality,
        string calldata ipfsHash
    ) external onlyCollector returns (bytes32 batchId) {
        require(bytes(herbName).length > 0, "HerbBatch: herb name required");
        require(bytes(geoLatitude).length > 0, "HerbBatch: latitude required");
        require(bytes(geoLongitude).length > 0, "HerbBatch: longitude required");
        require(harvestDate <= block.timestamp, "HerbBatch: harvest date cannot be in the future");

        // Generate a unique batch ID
        batchId = keccak256(
            abi.encodePacked(
                msg.sender,
                herbName,
                harvestDate,
                block.timestamp,
                block.prevrandao
            )
        );

        require(!batches[batchId].exists, "HerbBatch: batch ID collision, retry");

        // Build the collection event
        CollectionEvent memory evt = CollectionEvent({
            gpsLatitude: geoLatitude,
            gpsLongitude: geoLongitude,
            timestamp: block.timestamp,
            collectorAddress: msg.sender,
            herbSpecies: herbSpecies,
            quantity: quantity,
            unit: unit,
            weather: weather,
            temperature: temperature,
            initialQuality: initialQuality,
            ipfsHash: ipfsHash
        });

        // Store the batch
        batches[batchId] = Batch({
            batchId: batchId,
            herbName: herbName,
            collector: msg.sender,
            geoLatitude: geoLatitude,
            geoLongitude: geoLongitude,
            harvestDate: harvestDate,
            isSustainable: isSustainable,
            currentOwner: msg.sender,
            exists: true,
            collection: evt
        });

        allBatchIds.push(batchId);

        emit BatchCreated(batchId, herbName, msg.sender, harvestDate, isSustainable);
        emit CollectionRecorded(batchId, msg.sender, herbSpecies, block.timestamp);

        return batchId;
    }

    /**
     * @notice Get core information about a batch.
     * @param batchId The batch to query
     * @return The full Batch struct
     */
    function getBatch(bytes32 batchId) external view batchExists(batchId) returns (Batch memory) {
        return batches[batchId];
    }

    /**
     * @notice Get the collection event details for a batch.
     * @param batchId The batch to query
     * @return The CollectionEvent struct
     */
    function getCollectionEvent(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (CollectionEvent memory)
    {
        return batches[batchId].collection;
    }

    /**
     * @notice Get the current owner of a batch.
     * @param batchId The batch to query
     * @return address of current owner
     */
    function getCurrentOwner(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (address)
    {
        return batches[batchId].currentOwner;
    }

    /**
     * @notice Returns the total number of batches created.
     */
    function totalBatches() external view returns (uint256) {
        return allBatchIds.length;
    }

    /**
     * @notice Internal helper to update the current owner of a batch.
     * @dev Called by SupplyChain during ownership transfers.
     * @param batchId The batch to update
     * @param newOwner The new owner address
     */
    function _updateOwner(bytes32 batchId, address newOwner) internal batchExists(batchId) {
        require(newOwner != address(0), "HerbBatch: zero address owner");
        batches[batchId].currentOwner = newOwner;
    }
}
