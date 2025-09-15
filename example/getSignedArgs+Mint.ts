import { createWalletClient, custom } from 'viem'
import { hyperliquidEvmTestnet } from 'viem/chains'

/** Get signature + minter arguments from API call **/

// Requires env var API_KEY.
export const getSingleSignedLabel = async () => {
    const apiKey = process.env.API_KEY as string;
    const label = 'examplename';
    const response = await fetch(
        'https://api.testnet.hlnames.xyz/private/sign_mintpass/',
        {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ label })
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // minter_args types: {label: string, sig: string, timestamp: number, tieredPrice: string, referral_hash: string}
    const minter_args = await response.json();
    if (minter_args.sig === undefined) {
        throw new Error("Failed to get signature.");
    }
    else {
        return minter_args;
    }
}

// Call Minter contract with minter_args
// Requires env var: TESTNET_MINTER_ADDRESS
const minterAddress = process.env.TESTNET_MINTER_ADDRESS as `0x${string}`;

const minterAbi = [
  {
    name: 'mintWithNative',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { type: 'string', name: 'label' },
      { type: 'uint256', name: 'durationInYears' },
      { type: 'bytes', name: 'sig' },
      { type: 'uint256', name: 'timestamp' },
      { type: 'bytes32', name: 'referral' },
    ],
    outputs: [],
  },
  {
    name: 'getPriceOfNativeInUSD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
  }
] as const;

// For production dApp with user wallet (MetaMask, WalletConnect, etc.)
export const createUserWalletClient = (walletProvider: any) => {
  return createWalletClient({
    chain: hyperliquidEvmTestnet,
    transport: custom(walletProvider), // walletProvider is window.ethereum for MetaMask
  });
};

/**
 * 
 * @param minter_args // minter_args from getSingleSignedLabel()
 * @param walletClient 
 * @returns 
 */
export const prepareMintTransaction = async (minter_args: any, walletClient: any) => {
  // Payment amount comes directly from API response (no contract read needed)
  const requiredPayment = BigInt(minter_args.tieredPrice);

  // Return transaction object for user wallet to sign
  return {
    address: minterAddress,
    abi: minterAbi,
    functionName: 'mintWithNative',
    args: [
      minter_args.label,
      minter_args.durationInYears,
      minter_args.sig,
      minter_args.timestamp,
      minter_args.referral_hash,
    ],
    value: requiredPayment,
  };
};
