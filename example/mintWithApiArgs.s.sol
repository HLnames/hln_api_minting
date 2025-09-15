// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";

interface IHLN_RefMinter {
    function mintWithNative(string calldata label, uint256 durationInYears, bytes calldata sig, uint256 timestamp, bytes32 referral) external payable;
    function getPriceOfNativeInUSD() external view returns (uint256);
}

contract MintScript is Script {
    function run() public {
    // Requires env var TESTNET_MINTER_ADDRESS=0x6284e439514604B9eaAbc8537330d3E4f0313Df6
    IHLN_RefMinter minterContract = IHLN_RefMinter(vm.envAddress("TESTNET_MINTER_ADDRESS"));

    // Dummy params from getSingleSignedLabel() call:
    string memory label = "examplename";
    uint256 durationInYears = 1;
    bytes memory sig = hex"6cd690efdd4bac5620a0eb882714c74ac4a691942409db30e1b6c4f2d547737d6da20dc2cfb58ae8b803c0a916fc130cf74edd455d228b50e2fcef9b4709d4061c";
    uint256 timestamp = 1734380244;
    uint256 tieredPrice = 1000000000000000000; // 1 HYPE in wei
    string memory token = "native";
    bytes32 referral_hash = 0x16cf12aee280fca6f9552bf861dbd966fb9b5ddfceee7d568888e461e0178016;

    // Calculate native payment in HYPE from tierFee
    uint256 requiredPayment = (tieredPrice * 1e18) / minterContract.getPriceOfNativeInUSD();
    // Mint with HYPE + referral
    minterContract.mintWithNative{value: requiredPayment}(label, durationInYears, sig, timestamp, referral_hash);

    // Pass bytes32(0) in referral_hash for "no-referral" mode
    }
}
