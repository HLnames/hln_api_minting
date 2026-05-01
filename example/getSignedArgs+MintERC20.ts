import { createWalletClient, custom, createPublicClient, http, maxUint256, type Address } from 'viem'
import { hyperliquidEvmTestnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { minterAbi, erc20Abi } from './abi/minterAbi'

/** Get signature + minter arguments from API call (USDH / ERC20 variant) **/

// Testnet USDH address. Mainnet: 0x111111a1a0667d36bD57c0A9f569b98057111111
const USDH_TESTNET = '0x22222245c52C817f95b74664AE8546B490222222' as Address;

// Requires env var API_KEY.
export const getSingleSignedLabelERC20 = async () => {
  const apiKey = process.env.API_KEY as string;
  const label = 'examplename';

  // Fail early if label cannot be normalized
  try {
    const normalizedLabel = normalize(label);

    const response = await fetch(
      'https://api.testnet.hlnames.xyz/sign_mintpass/' + normalizedLabel,
      {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        // Pass the ERC20 token address to price the mint in USDH instead of native HYPE.
        // Omitting `token` (or sending `"native"`) returns native pricing.
        body: JSON.stringify({ token: USDH_TESTNET }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // minter_args types: { label: string, sig: string, timestamp: number, token: string, amountRequired: string }
    // For ERC20 mode `token` is the checksummed token address and `amountRequired` is denominated
    // in that token's base units (USDH = 6 decimals, so 20_000_000 == $20.00).
    const minter_args = await response.json();
    if (minter_args.sig === undefined) {
      throw new Error('Failed to get signature.');
    }
    return minter_args;
  } catch (error) {
    console.error(`Error normalizing label, abort: ${error}`);
  }
};

// Requires env var: TESTNET_MINTER_ADDRESS, TESTNET_RPC_URL
const minterAddress = process.env.TESTNET_MINTER_ADDRESS as Address;
const rpcUrl = process.env.TESTNET_RPC_URL || 'https://rpc.hyperliquid-testnet.xyz/evm';

// Public client for read-only allowance check (no wallet required)
const publicClient = createPublicClient({
  chain: hyperliquidEvmTestnet,
  transport: http(rpcUrl),
});

// For production dApp with user wallet
export const createUserWalletClient = (walletProvider: any) => {
  return createWalletClient({
    chain: hyperliquidEvmTestnet,
    transport: custom(walletProvider),
  });
};

/**
 * Check the user's current USDH allowance for the Minter contract and, if it's below
 * `amountRequired`, return a transaction object that approves the Minter to spend the user's USDH.
 *
 * Returns `null` if the existing allowance is already sufficient — caller should skip straight
 * to the mint transaction in that case.
 *
 * Approval strategy: this example approves `maxUint256` so subsequent mints by the same user
 * skip the approve step entirely (matches the production HLN frontend behavior). If you prefer
 * an exact-amount approval per mint (e.g. for security-sensitive integrations), substitute
 * `BigInt(minter_args.amountRequired)` for `maxUint256` below — the trade-off is one extra
 * approve tx per mint.
 */
export const ensureUsdhAllowance = async (
  userAddress: Address,
  minter_args: any,
) => {
  const tokenAddress = minter_args.token as Address;
  const amountRequired = BigInt(minter_args.amountRequired);

  const currentAllowance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress, minterAddress],
  });

  if ((currentAllowance as bigint) >= amountRequired) {
    return null;
  }

  return {
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve' as const,
    args: [minterAddress, maxUint256] as const,
  };
};

/**
 * Build the `mintWithERC20` transaction object. Unlike the native flow there's no `value` field
 * and no slippage buffer — the API returns the exact USDH amount the contract will charge, and
 * the price is fixed (USDH ≈ $1.00). The caller must send the approve transaction first (see
 * `ensureUsdhAllowance`) and wait for it to mine before submitting this transaction.
 *
 * @param minter_args  The body returned from /sign_mintpass with `{ token: USDH_ADDRESS }`.
 */
export const prepareMintERC20Transaction = (minter_args: any) => {
  return {
    address: minterAddress,
    abi: minterAbi,
    functionName: 'mintWithERC20' as const,
    args: [
      minter_args.label,
      BigInt(minter_args.durationInYears || 1), // Default to 1 year
      minter_args.sig as `0x${string}`,
      BigInt(minter_args.timestamp),
      minter_args.token as Address,
      '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // Replace with referrer's namehash
    ] as const,
  };
};

/**
 * Full end-to-end example: fetch USDH-denominated mint args, ensure allowance, then mint.
 * `walletProvider` is e.g. `window.ethereum`.
 */
export const mintWithUsdh = async (walletProvider: any, userAddress: Address) => {
  const minter_args = await getSingleSignedLabelERC20();
  if (!minter_args) throw new Error('Failed to fetch mint args');

  const walletClient = createUserWalletClient(walletProvider);

  const approveTx = await ensureUsdhAllowance(userAddress, minter_args);
  if (approveTx) {
    const approveHash = await walletClient.writeContract({ ...approveTx, account: userAddress });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  const mintTx = prepareMintERC20Transaction(minter_args);
  const mintHash = await walletClient.writeContract({ ...mintTx, account: userAddress });
  return await publicClient.waitForTransactionReceipt({ hash: mintHash });
};
