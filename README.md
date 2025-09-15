# Minting Hyperliquid Names via API

This repository provides example snippets for minting referral-enabled Hyperliquid Names on HyperEVM Testnet via the HL Names REST-API.

| **Resource** | **Endpoint/Address** |
| :--- | :--- |
| Testnet Minter Contract | `0x6284e439514604B9eaAbc8537330d3E4f0313Df6` |
| Testnet API Endpoint | `https://api.testnet.hlnames.xyz`|

## Minting Workflow

Integrating the minting process into your dApp with two steps:

### Step 1: Get Minter Arguments from the API

Request a "signed mint-pass" for a given label. Supplying an authorized `API_KEY` is required.

Send a `POST` request to the following resource URI with label appended: `api/private/sign_mintpass/${label}`

*   **Headers**:
    *   `X-API-Key`: AUTHORIZED-API-KEY.
    *   `Content-Type`: `application/json`

API will respond with a JSON object containing the specific arguments needed to call Minter contract:
```json
{
  "label": "examplename",
  "sig": "0x...",
  "timestamp": 1757904606,
  "token": "native",
  "amountRequired": "199004",
  "referral_hash": "0x..."
}
```

- **`amountRequired`**: The required payment in `token` mode (native == HYPE), in its HyperEVM precision. API handles the oracle quote for calculating the required amount for that price tier.
- **`sig`**: A unique signature for the minting transaction. It is only valid for **60 seconds**, until the `timestamp` is reached.

### Step 2: Call Minter contract

**Mint with Native Token (HYPE):**

Call the `mintWithNative` function, populating the Minter's expected arguments:

```solidity
function mintWithNative(
    string calldata label,
    uint256 durationInYears,
    bytes calldata sig,
    uint256 timestamp,
    bytes32 referral
) external payable;
```
- The `msg.value` of this transaction must be equal to the `amountRequired` from the API response.
- The `durationInYears` parameter is set by the client to determine the registration period. Setting as zero will revert.

## Referral System

The minting process includes an optional referral system.

- **With a Referral**: To attribute a mint to a referrer, the `referral_hash` must be the `namehash` of the referrer's HL name (e.g., `namehash("referrer.hl")`).
- **Without a Referral**: To mint without a referral, pass an empty 32-byte hex value (`0x0000...`) as the `referral_hash`.

## Pricing

Registration prices are based on the length of the name and are set in USD for a one-year period. The price scales linearly for multi-year registrations (e.g., a two-year registration costs double).

- **1 character**: $69
- **2 characters**: $42
- **3 characters**: $33
- **4+ characters**: $20

## Example Snippets

- **`example/getSignedArgs.ts`**: A simple TypeScript function to request valid Minter arguments from the API.
- **`example/getSignedArgs+Mint.ts`**: A complete TypeScript example demonstrating the full workflow, from fetching API arguments to preparing a transaction object on behalf of connected signer.
- **`example/mintWithApiArgs.s.sol`**: A Forge script showing how to use the API arguments to interact with the Minter contract via RPC.