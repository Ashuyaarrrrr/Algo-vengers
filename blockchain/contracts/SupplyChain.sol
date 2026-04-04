// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./QualityTest.sol";

/**
 * @title SupplyChain
 * @dev Tracks ownership transfers along the Ayurvedic herb supply chain.
 *      Every change of custody is recorded immutably on-chain.
 *      Inherits QualityTest → Processing → HerbBatch → RoleManager.
 */
contract SupplyChain is QualityTest {

    // ─── Structs ─────────────────────────────────────────────────────────────

    /**
     * @dev Records a single transfer of custody for a batch.
     */
    struct TransferRecord {
        address from;             // Previous custodian
        address to;               // New custodian
        bytes32 batchId;          // Batch being transferred
        uint256 timestamp;        // When the transfer occurred
        string location;          // Transfer location (city/port/warehouse)
        string notes;             // Optional handover notes
        uint256 transferIndex;    // Sequential index for this batch's transfers
        string ipfsHash;          // IPFS CID for Bill of Lading or receipt
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    /// @dev Maps batchId → array of TransferRecord structs
    mapping(bytes32 => TransferRecord[]) public transferHistory;

    // ─── Events ──────────────────────────────────────────────────────────────

    event OwnershipTransferred(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to,
        string location,
        uint256 timestamp
    );

    // ─── Modifiers ───────────────────────────────────────────────────────────

    /**
     * @dev Ensures only the current owner of a batch can transfer it.
     */
    modifier onlyCurrentOwner(bytes32 batchId) {
        require(
            batches[batchId].currentOwner == msg.sender,
            "SupplyChain: caller is not the current batch owner"
        );
        _;
    }

    /**
     * @dev Ensures the recipient has a valid supply chain role.
     *      Prevents transfers to arbitrary addresses without roles.
     */
    modifier recipientHasRole(address to) {
        require(
            hasRole(COLLECTOR_ROLE, to) ||
            hasRole(PROCESSOR_ROLE, to) ||
            hasRole(LAB_ROLE, to) ||
            hasRole(MANUFACTURER_ROLE, to) ||
            hasRole(DISTRIBUTOR_ROLE, to) ||
            hasRole(RETAILER_ROLE, to) ||
            hasRole(ADMIN_ROLE, to) ||
            hasRole(RETAILER_ROLE, msg.sender),
            "SupplyChain: recipient has no supply chain role"
        );
        _;
    }

    // ─── Functions ───────────────────────────────────────────────────────────

    /**
     * @notice Transfer custody of a herb batch to another supply chain participant.
     */
    function transferOwnership(
        bytes32 batchId,
        address to,
        string calldata location,
        string calldata notes,
        string calldata ipfsHash
    )
        external
        batchExists(batchId)
        onlyCurrentOwner(batchId)
        recipientHasRole(to)
    {
        require(to != msg.sender, "SupplyChain: cannot transfer to yourself");
        require(to != address(0), "SupplyChain: zero address recipient");
        require(bytes(location).length > 0, "SupplyChain: location required");

        address previousOwner = batches[batchId].currentOwner;

        // Update the owner in HerbBatch
        _updateOwner(batchId, to);

        uint256 transferIndex = transferHistory[batchId].length;

        // Record the transfer
        TransferRecord memory record = TransferRecord({
            from: previousOwner,
            to: to,
            batchId: batchId,
            timestamp: block.timestamp,
            location: location,
            notes: notes,
            transferIndex: transferIndex,
            ipfsHash: ipfsHash
        });

        transferHistory[batchId].push(record);

        emit OwnershipTransferred(batchId, previousOwner, to, location, block.timestamp);
    }

    /**
     * @notice Get the full transfer history for a batch.
     */
    function getTransferHistory(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (TransferRecord[] memory)
    {
        return transferHistory[batchId];
    }

    /**
     * @notice Get a specific transfer record by index.
     */
    function getTransfer(bytes32 batchId, uint256 transferIndex)
        external
        view
        batchExists(batchId)
        returns (TransferRecord memory)
    {
        require(
            transferIndex < transferHistory[batchId].length,
            "SupplyChain: transfer index out of bounds"
        );
        return transferHistory[batchId][transferIndex];
    }

    /**
     * @notice Returns total number of transfers for a batch.
     */
    function getTransferCount(bytes32 batchId)
        external
        view
        batchExists(batchId)
        returns (uint256)
    {
        return transferHistory[batchId].length;
    }
}
