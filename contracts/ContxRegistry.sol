// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ContxRegistry {
    struct Profile {
        address owner;
        string username;
        bool exists;
    }
    
    // Core profile data
    mapping(string => Profile) public profiles;
    mapping(string => bool) public usernameExists;
    mapping(address => string) public addressToUsername;
    
    // Profile fields stored as key-value pairs to avoid stack depth issues
    mapping(string => mapping(string => string)) public profileData;
    
    event SubdomainRegistered(string indexed username, address indexed owner);
    event ProfileUpdated(string indexed username, string indexed field);
    
    // Simple registration (just username + name + bio)
    function register(
        string calldata username,
        string calldata name,
        string calldata bio
    ) external {
        require(!usernameExists[username], "Username taken");
        require(bytes(username).length >= 3, "Username too short");
        require(bytes(username).length <= 32, "Username too long");
        require(bytes(addressToUsername[msg.sender]).length == 0, "Address already has username");
        
        // Store core profile
        profiles[username] = Profile({
            owner: msg.sender,
            username: username,
            exists: true
        });
        
        // Store profile fields
        profileData[username]["name"] = name;
        profileData[username]["bio"] = bio;
        
        usernameExists[username] = true;
        addressToUsername[msg.sender] = username;
        
        emit SubdomainRegistered(username, msg.sender);
    }
    
    // Update any field individually - much simpler!
    function updateField(
        string calldata username,
        string calldata field,
        string calldata value
    ) external {
        require(profiles[username].exists, "Username not found");
        require(profiles[username].owner == msg.sender, "Not owner");
        
        profileData[username][field] = value;
        emit ProfileUpdated(username, field);
    }
    
    // Batch update multiple fields
    function updateFields(
        string calldata username,
        string[] calldata fields,
        string[] calldata values
    ) external {
        require(profiles[username].exists, "Username not found");
        require(profiles[username].owner == msg.sender, "Not owner");
        require(fields.length == values.length, "Arrays length mismatch");
        
        for (uint i = 0; i < fields.length; i++) {
            profileData[username][fields[i]] = values[i];
            emit ProfileUpdated(username, fields[i]);
        }
    }
    
    // ENS-compatible address resolution
    function getAddress(string calldata username) external view returns (address) {
        require(profiles[username].exists, "Username not found");
        return profiles[username].owner;
    }
    
    // ENS-compatible text record resolution
    function getText(string calldata username, string calldata key) 
        external view returns (string memory) {
        require(profiles[username].exists, "Username not found");
        return profileData[username][key];
    }
    
    // Get multiple fields at once
    function getFields(string calldata username, string[] calldata keys)
        external view returns (string[] memory) {
        require(profiles[username].exists, "Username not found");
        
        string[] memory values = new string[](keys.length);
        for (uint i = 0; i < keys.length; i++) {
            values[i] = profileData[username][keys[i]];
        }
        return values;
    }
    
    // Get core profile info
    function getProfile(string calldata username) 
        external view returns (address owner, string memory usernameReturn, bool exists) {
        Profile memory profile = profiles[username];
        return (profile.owner, profile.username, profile.exists);
    }
    
    // Check username availability
    function isAvailable(string calldata username) external view returns (bool) {
        return !usernameExists[username] && 
               bytes(username).length >= 3 && 
               bytes(username).length <= 32;
    }
    
    // Get all field names for a profile (helper for frontends)
    // Note: Currently returns standard field names for all profiles
    // TODO: Implement per-profile field tracking for customization
    function getFieldNames(string calldata /* username */) external pure returns (string[] memory) {
        string[] memory fields = new string[](11);
        fields[0] = "name";
        fields[1] = "bio";
        fields[2] = "lore";
        fields[3] = "messageExamples";
        fields[4] = "postExamples";
        fields[5] = "adjectives";
        fields[6] = "topics";
        fields[7] = "style";
        fields[8] = "knowledge";
        fields[9] = "avatar";
        fields[10] = "description"; // ENS standard
        return fields;
    }
}