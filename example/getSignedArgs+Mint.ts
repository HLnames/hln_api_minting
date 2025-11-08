import { createWalletClient, custom } from 'viem'
import { hyperliquidEvmTestnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { minterAbi } from './abi/minterAbi'

/** Get signature + minter arguments from API call **/

// Requires env var API_KEY.
export const getSingleSignedLabel = async () => {
    const apiKey = process.env.API_KEY as string;
    const label = 'examplename';

    // Fail early if label cannot be normalized
    try {
      const normalizedLabel = normalize(label);

      const response = await fetch(
          'https://api.testnet.hlnames.xyz/private/sign_mintpass/' + normalizedLabel,
          {
              method: 'POST',
              headers: {
                  'X-API-Key': apiKey,
                  'Content-Type': 'application/json'
              },
          }
      );

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      // minter_args types: {label: string, sig: string, timestamp: number, amountRequired: string, referral_hash: string}
      const minter_args = await response.json();
      if (minter_args.sig === undefined) {
          throw new Error("Failed to get signature.");
      }
      else {
          return minter_args;
      }
  } catch (error) {
    console.error(`Error normalizing label, abort: ${error}`);
  }
}

// Call Minter contract with minter_args
// Requires env var: TESTNET_MINTER_ADDRESS
const minterAddress = process.env.TESTNET_MINTER_ADDRESS as `0x${string}`;

// For production dApp with user wallet
export const createUserWalletClient = (walletProvider: any) => {
  return createWalletClient({
    chain: hyperliquidEvmTestnet,
    transport: custom(walletProvider),
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
  // API returns amountRequired as string to preserve precision for large values, so cast to BigInt
  const amountRequired = BigInt(minter_args.amountRequired);

  // Add in 2% slippage to the HYPE/USD rate, in case of oracle volatility.
  // N.B. Should be refunded to payer if unfilled
  const slippagePercentage = 2n; // 2%
  const hundred = 100n;
  const paymentValue = amountRequired * (hundred + slippagePercentage) / hundred;

  // Return transaction object for user wallet to sign
  return {
    address: minterAddress,
    abi: minterAbi,
    functionName: 'mintWithNative',
    args: [
      minter_args.label,
      minter_args.durationInYears || 1, // Default to 1 year, if not unset by user
      minter_args.sig,
      minter_args.timestamp,
      minter_args.referral_hash,
    ],
    value: paymentValue,
  };
};
