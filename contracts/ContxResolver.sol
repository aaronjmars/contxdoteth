// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ContxResolver - Clean Implementation without Overloading
 * @dev CCIP-Read resolver for contx.eth with full ENS interface support
 */
contract ContxResolver {
    
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );
    
    address public owner;
    string[] public gateways;
    
    // Interface IDs for ENS compatibility
    bytes4 constant private INTERFACE_META_ID = 0x01ffc9a7; // supportsInterface
    bytes4 constant private ADDR_INTERFACE_ID = 0x3b3b57de; // addr(bytes32)
    bytes4 constant private ADDRESS_INTERFACE_ID = 0xf1cb7e06; // addr(bytes32,uint256)
    bytes4 constant private TEXT_INTERFACE_ID = 0x59d1d43c; // text(bytes32,string)
    bytes4 constant private CONTENTHASH_INTERFACE_ID = 0xbc1c58d1; // contenthash(bytes32)
    bytes4 constant private PUBKEY_INTERFACE_ID = 0xc8690233; // pubkey(bytes32)
    bytes4 constant private ABI_INTERFACE_ID = 0x2203ab56; // ABI(bytes32,uint256)
    bytes4 constant private NAME_INTERFACE_ID = 0x691f3431; // name(bytes32)
    
    event GatewaysUpdated(string[] newGateways);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(string[] memory _gateways) {
        owner = msg.sender;
        gateways = _gateways;
        emit GatewaysUpdated(_gateways);
    }
    
    function updateGateways(string[] memory _gateways) external onlyOwner {
        gateways = _gateways;
        emit GatewaysUpdated(_gateways);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function getGateways() external view returns (string[] memory) {
        return gateways;
    }
    
    /**
     * @dev Standard ENS address resolution (ETH address)
     */
    function addr(bytes32 node) external view returns (address) {
        bytes memory callData = abi.encode(node, ADDR_INTERFACE_ID);
        revert OffchainLookup(
            address(this),
            gateways,
            callData,
            this.addrCallback.selector,
            callData
        );
    }
    
    function addrCallback(
        bytes calldata response,
        bytes calldata /* extraData */
    ) external pure returns (address) {
        return abi.decode(response, (address));
    }
    
    /**
     * @dev Multi-coin address resolution (EIP-2304)
     */
    function addr(bytes32 node, uint256 coinType) external view returns (bytes memory) {
        // For non-ETH coins, return empty
        if (coinType != 60) { // 60 = ETH coin type
            return "";
        }
        
        // For ETH, delegate to single-coin addr function via CCIP-Read
        bytes memory callData = abi.encode(node, ADDR_INTERFACE_ID);
        revert OffchainLookup(
            address(this),
            gateways,
            callData,
            this.addrMultiCallback.selector,
            callData
        );
    }
    
    function addrMultiCallback(
        bytes calldata response,
        bytes calldata /* extraData */
    ) external pure returns (bytes memory) {
        address ethAddr = abi.decode(response, (address));
        return abi.encodePacked(ethAddr);
    }
    
    /**
     * @dev Text record resolution
     */
    function text(bytes32 node, string calldata key) external view returns (string memory) {
        bytes memory callData = abi.encode(node, TEXT_INTERFACE_ID, key);
        revert OffchainLookup(
            address(this),
            gateways,
            callData,
            this.textCallback.selector,
            callData
        );
    }
    
    function textCallback(
        bytes calldata response,
        bytes calldata /* extraData */
    ) external pure returns (string memory) {
        return abi.decode(response, (string));
    }
    
    /**
     * @dev Content hash resolution (returns empty - not supported)
     */
    function contenthash(bytes32 /* node */) external pure returns (bytes memory) {
        return "";
    }
    
    /**
     * @dev Public key resolution (returns empty - not supported)
     */
    function pubkey(bytes32 /* node */) external pure returns (bytes32 x, bytes32 y) {
        return (0, 0);
    }
    
    /**
     * @dev ABI resolution (returns empty - not supported)
     */
    function ABI(bytes32 /* node */, uint256 /* contentTypes */) external pure returns (uint256, bytes memory) {
        return (0, "");
    }
    
    /**
     * @dev Name resolution (returns empty - reverse resolution not supported)
     */
    function name(bytes32 /* node */) external pure returns (string memory) {
        return "";
    }
    
    /**
     * @dev Interface support check (EIP-165)
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == INTERFACE_META_ID ||
               interfaceId == ADDR_INTERFACE_ID ||
               interfaceId == ADDRESS_INTERFACE_ID ||
               interfaceId == TEXT_INTERFACE_ID ||
               interfaceId == CONTENTHASH_INTERFACE_ID ||
               interfaceId == PUBKEY_INTERFACE_ID ||
               interfaceId == ABI_INTERFACE_ID ||
               interfaceId == NAME_INTERFACE_ID;
    }
}