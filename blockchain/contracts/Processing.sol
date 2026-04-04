// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HerbBatch.sol";

/**
 * @title Processing
 * @dev Records processing steps performed on herb batches.
 *      Supports drying, grinding, storage, and other operations.
 *      Inherits HerbBatch (which inherits RoleManager).
 */
contract Processing is HerbBatch {

    // ─── Enums ───────────────────────────────────────────────────────────────

    /**
     * @dev Enumeration of supported processing types.
     */
    enum ProcessType {
        DRYING,     // 0 - Sun or mechanically drying herbs
        GRINDING,   // 1 - Grinding into powder
        STORAGE,    // 2 - Long-term storage setup
        EXTRACTION, // 3 - Creating extracts/oils
        SORTING,    // 4 - Grading and sorting by quality
        PACKAGING   // 5 - Final packaging
    }

    // ─── Structs ─────────────────────────────────────────────────────────────

    /**
     * @dev Records a single processing step applied to a batch.
     */
    struct ProcessingStep {
        bytes32 batchId;            // Batch this step applies to
        ProcessType processType;    // Type of processing (enum)
        address processorAddress;   // Processor performing the operation
        uint256 timestamp;          // When this step was performed
        string storageConditions;   // Temperature, humidity, container type etc.
        string notes;               // Any additional processing notes
        uint256 stepIndex;          // Sequential step number for this batch
        int256 temperature;         // Temperature during processing
        uint256 humidity;           // Humidity during processing (%)
        string facilityId;          // ID of the processing facility
        string ipfsHash;            // CID for reports / certificates
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    /// @dev Maps batchId → array of ProcessingStep records
    mapping(bytes32 => ProcessingStep[]) public processingSteps;

    // ─── Events ──────────────────────────────────────────────────────────────

    event ProcessingStepAdded(
        bytes32 indexed batchId,
        ProcessType indexed processType,
        address indexed processor,
        uint256 stepIndex,
        uint256 timestamp
    );

    // ─── Modifiers ───────────────────────────────────────────────────────────

    /**
     * @dev Restricts function to accounts with PROCESSOR_ROLE.
     */
    modifier onlyProcessor() {
        require(
            hasRole(PROCESSOR_ROLE, msg.sender),
            "Processing: caller is not a processor"
        );
        _;
    }

    // ─── Functions ───────────────────────────────────────────────────────────

    /**
     * @notice Record a processing step performed on a herb batch.
     * @dev Only accounts with PROCESSOR_ROLE can call this.
     *      Each step is appended to the batch's processing history.
     */
    function addProcessingStep(
        bytes32 batchId,
        ProcessType processType,
        string calldata storageConditions,
        string calldata notes,
        int256 temperature,
        uint256 humidity,
        string calldata facilityId,
        string calldata ipfsHash
    ) external onlyProcessor batchExists(batchId) {
        require(
            bytes(storageConditions).length > 0,
            "Processing: storage conditions required"
        );

        uint256 stepIndex = processingSteps[batchId].length;

        ProcessingStep memory step = ProcessingStep({
            batchId: batchId,
            processType: processType,
            processorAddress: msg.sender,
            timestamp: block.timestamp,
            storageConditions: storageConditions,
            notes: notes,
            stepIndex: stepIndex,
            temperature: temperature,
            humidity: humidity,
            facilityId: facilityId,
            ipfsHash: ipfsHash
        });

        processingSteps[batchId].push(step);

        emit ProcessingStepAdded(
            batchId,
            processType,
            msg.sender,
            stepIndex,
            block.timestamp
        );
    }

    /**
     * @notice Get all processing steps for a given batch.
     * @param batchId The batch to query
     * @return Array of ProcessingStep structs
     */
    function getProcessingSteps(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (ProcessingStep[] memory)
    {
        return processingSteps[batchId];
    }

    /**
     * @notice Get a specific processing step by index.
     * @param batchId The batch to query
     * @param stepIndex Index of the step (0-based)
     * @return The ProcessingStep at that index
     */
    function getProcessingStep(bytes32 batchId, uint256 stepIndex)
        external
        view
        batchExists(batchId)
        returns (ProcessingStep memory)
    {
        require(
            stepIndex < processingSteps[batchId].length,
            "Processing: step index out of bounds"
        );
        return processingSteps[batchId][stepIndex];
    }

    /**
     * @notice Returns the total number of processing steps for a batch.
     * @param batchId The batch to query
     * @return count of processing steps
     */
    function getProcessingStepCount(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (uint256)
    {
        return processingSteps[batchId].length;
    }
}
