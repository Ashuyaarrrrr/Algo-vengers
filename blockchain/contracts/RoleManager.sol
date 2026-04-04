// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RoleManager
 * @dev Manages roles for the Ayurvedic herb supply chain system.
 *      Uses OpenZeppelin AccessControl for granular permission management.
 *      All other contracts inherit from this to enforce role-based access.
 */
contract RoleManager is AccessControl {
    // ─── Role Definitions ────────────────────────────────────────────────────

    /// @notice Role for system administrators (can grant/revoke all roles)
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;

    /// @notice Role for herb collectors (farmers who harvest herbs)
    bytes32 public constant COLLECTOR_ROLE = keccak256("COLLECTOR_ROLE");

    /// @notice Role for processors (drying, grinding, storage facilities)
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");

    /// @notice Role for labs (quality testing and DNA authentication)
    bytes32 public constant LAB_ROLE = keccak256("LAB_ROLE");

    /// @notice Role for manufacturers (final product makers)
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");

    /// @notice Role for distributors (logistics and distribution)
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    /// @notice Role for retailers (final point of sale)
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    // ─── Events ──────────────────────────────────────────────────────────────

    event RoleGrantedToMember(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevokedFromMember(bytes32 indexed role, address indexed account, address indexed sender);

    // ─── Constructor ─────────────────────────────────────────────────────────

    /**
     * @dev Grants the deployer the DEFAULT_ADMIN_ROLE so they can manage all roles.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ─── Role Management Functions ───────────────────────────────────────────

    /**
     * @notice Grant a role to a participant in the supply chain.
     * @dev Only callable by accounts with ADMIN_ROLE.
     * @param role The role identifier (e.g., COLLECTOR_ROLE)
     * @param account The address to receive the role
     */
    function grantSupplyChainRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "RoleManager: zero address");
        _grantRole(role, account);
        emit RoleGrantedToMember(role, account, msg.sender);
    }

    /**
     * @notice Revoke a role from a participant.
     * @dev Only callable by accounts with ADMIN_ROLE.
     * @param role The role identifier
     * @param account The address to lose the role
     */
    function revokeSupplyChainRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "RoleManager: zero address");
        _revokeRole(role, account);
        emit RoleRevokedFromMember(role, account, msg.sender);
    }

    /**
     * @notice Check whether an address holds a specific role.
     * @param role The role identifier
     * @param account The address to check
     * @return bool True if the account has the role
     */
    function hasSupplyChainRole(bytes32 role, address account) external view returns (bool) {
        return hasRole(role, account);
    }
}
