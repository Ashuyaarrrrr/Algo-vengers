// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Processing.sol";

/**
 * @title QualityTest
 * @dev Records laboratory quality tests performed on herb batches.
 *      Supports moisture content, pesticide level, and DNA authentication checks.
 *      Inherits Processing → HerbBatch → RoleManager.
 */
contract QualityTest is Processing {

    // ─── Structs ─────────────────────────────────────────────────────────────

    /**
     * @dev Represents a full laboratory quality test result for a batch.
     */
    struct QualityTestRecord {
        bytes32 batchId;           // Batch tested
        uint256 moistureContent;   // Moisture % (scaled by 100, e.g. 1250 = 12.50%)
        uint256 pesticideLevel;    // Pesticide level in ppb (parts per billion)
        bool dnaAuthenticated;     // Whether DNA authentication passed
        address labAddress;        // Lab that performed the test
        bool passed;               // Overall pass/fail verdict
        uint256 timestamp;         // When the test was recorded
        string remarks;            // Lab remarks or additional findings
        uint256 testIndex;         // Sequential test number for this batch
        string ipfsHash;           // IPFS CID for lab report / certificate
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    /// @dev Maps batchId → array of QualityTestRecord structs
    mapping(bytes32 => QualityTestRecord[]) public qualityTests;

    /// @dev Maps batchId → latest overall pass status (convenience flag)
    mapping(bytes32 => bool) public latestTestPassed;

    // ─── Events ──────────────────────────────────────────────────────────────

    event QualityTestRecorded(
        bytes32 indexed batchId,
        address indexed lab,
        bool passed,
        uint256 pesticideLevel,
        uint256 moistureContent,
        uint256 timestamp
    );

    event BatchFailed(
        bytes32 indexed batchId,
        address indexed lab,
        string reason,
        uint256 timestamp
    );

    // ─── Modifiers ───────────────────────────────────────────────────────────

    /**
     * @dev Restricts function to accounts with LAB_ROLE.
     */
    modifier onlyLab() {
        require(
            hasRole(LAB_ROLE, msg.sender),
            "QualityTest: caller is not a certified lab"
        );
        _;
    }

    // ─── Functions ───────────────────────────────────────────────────────────

    /**
     * @notice Record a quality test result for a herb batch.
     * @dev Only accounts with LAB_ROLE can call this.
     */
    function recordQualityTest(
        bytes32 batchId,
        uint256 moistureContent,
        uint256 pesticideLevel,
        bool dnaAuthenticated,
        bool passed,
        string calldata remarks,
        string calldata ipfsHash
    ) external onlyLab batchExists(batchId) {
        require(moistureContent <= 10000, "QualityTest: moisture cannot exceed 100.00%");

        uint256 testIndex = qualityTests[batchId].length;

        QualityTestRecord memory record = QualityTestRecord({
            batchId: batchId,
            moistureContent: moistureContent,
            pesticideLevel: pesticideLevel,
            dnaAuthenticated: dnaAuthenticated,
            labAddress: msg.sender,
            passed: passed,
            timestamp: block.timestamp,
            remarks: remarks,
            testIndex: testIndex,
            ipfsHash: ipfsHash
        });

        qualityTests[batchId].push(record);

        // Update the convenience pass flag with the latest result
        latestTestPassed[batchId] = passed;

        emit QualityTestRecorded(
            batchId,
            msg.sender,
            passed,
            pesticideLevel,
            moistureContent,
            block.timestamp
        );

        if (!passed) {
            emit BatchFailed(batchId, msg.sender, remarks, block.timestamp);
        }
    }

    /**
     * @notice Get all quality tests for a given batch.
     */
    function getQualityTests(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (QualityTestRecord[] memory)
    {
        return qualityTests[batchId];
    }

    /**
     * @notice Get a specific quality test by index.
     */
    function getQualityTest(bytes32 batchId, uint256 testIndex)
        external
        view
        batchExists(batchId)
        returns (QualityTestRecord memory)
    {
        require(
            testIndex < qualityTests[batchId].length,
            "QualityTest: test index out of bounds"
        );
        return qualityTests[batchId][testIndex];
    }

    /**
     * @notice Check whether a batch has passed its most recent quality test.
     */
    function isBatchApproved(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (bool)
    {
        require(
            qualityTests[batchId].length > 0,
            "QualityTest: no tests recorded for this batch"
        );
        return latestTestPassed[batchId];
    }

    /**
     * @notice Returns the total number of quality tests for a batch.
     */
    function getQualityTestCount(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (uint256)
    {
        return qualityTests[batchId].length;
    }
}
