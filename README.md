# Minting Hyperliquid Names via API

This repository provides example snippets for minting referral-enabled Hyperliquid Names on HyperEVM Testnet via the HL Names REST-API.

Join our Telegram group: https://t.me/+pDbWCyCnvrxlZmJh

| **Resource** | **Address** |
| :--- | :--- |
| Testnet Minter Contract | `0x6284e439514604B9eaAbc8537330d3E4f0313Df6` |
| Testnet API Endpoint | `https://api.testnet.hlnames.xyz`|

## Introduction
Hyperliquid Names enables names to be minted directly inside 3rd party dApps. This allows for a seamless onboarding flow where users can set up their wallet and give it a .hl identity in one experience. Combined with account abstraction, smart wallets, and other UX improvements, this enables dApps to deliver a familiar, web2-like account setup inside a web3 context.

3rd party minting also synergizes directly with the Hyperliquid Names affiliate program. DApps that integrate minting can automatically pass their own referral into the flow, adding an additional revenue stream. Here’s how it works:

- **User benefit**: Every name minted using your referral gets a 10% discount off the total cost.
- **DApp benefit**: Your dApp earns a 25% kickback on the total cost.

## Minting Workflow

Integrating the minting process into your dApp with two steps:

### Step 1: Get Minter Arguments from the API

#### Terms
- **signed mint-pass**: A valid signature plus arguments for minting a specific name
- **label**: A name without its .hl suffix

Request a signed mint-pass for a given label. 

First, ensure the label is normalized before calling the API. We use the [`normalize`](https://viem.sh/docs/ens/utilities/normalize#normalize) utility from the `viem/ens` package. A label must be ENS-normal and between 1-30 characters.

Next, send a `POST` request to the following resource URI with label appended: `/private/sign_mintpass/{label}`

*   **Headers**:
    *   `X-API-Key`: `API_KEY`
    *   `Content-Type`: `application/json`

An authorized `API_KEY` value in the header is required. 

If no error, the API will respond with a JSON object containing the specific arguments needed to call Minter contract:
```json
{
  "label": "examplename",
  "sig": "0x...",
  "timestamp": 1757904606,
  "token": "native",
  "amountRequired": "199004",
  "referralHash": "0x..."
}
```

- **`amountRequired`**: The required payment in `token` mode (native == HYPE), in its HyperEVM precision. API handles the oracle quote for calculating the required amount for that price tier.
- **`sig`**: A unique signature for the minting transaction. It is only valid for **60 seconds**, until the `timestamp` is reached.
- **`refreshHash`**: The namehash of the referrer's HL name to credit.

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
- The `durationInYears` parameter is set by the client to determine the registration period. It defaults to 1 year.

## Referral System

The minting process includes an optional referral system.

- **With a Referral**: To attribute a mint to a referrer, the `referralHash` must be the `namehash` of the referrer's HL name (e.g., `namehash("referrer.hl")`).
- **Without a Referral**: To mint without a referral, pass an empty 32-byte hex value (`0x0000...`) as the `referralHash`.

## Pricing

Registration prices are based on the length of the desired name and are paid in USD for a one-year base period.

- **1 character**: $69
- **2 characters**: $42
- **3 characters**: $33
- **4+ characters**: $20
- Each additional year extension: +$10

## Example Snippets

- **[`example/getSignedArgs.ts`](example/getSignedArgs.ts)**: A simple TypeScript function to request valid Minter arguments from the API.
- **[`example/getSignedArgs+Mint.ts`](example/getSignedArgs%2BMint.ts)**: A complete TypeScript example demonstrating the full workflow, from fetching API arguments to preparing a transaction object on behalf of connected signer.
- **[`example/mintWithApiArgs.s.sol`](example/mintWithApiArgs.s.sol)**: A forge script loading the API arguments to interact with the Minter contract via RPC.
