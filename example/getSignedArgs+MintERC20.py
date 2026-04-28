import os
import requests
from web3 import Web3
from web3.ens import normalize_name
from eth_utils import to_checksum_address
from .abi.minterAbi import minter_abi, erc20_abi

# Get signature + minter arguments from API call (USDH / ERC20 variant)

# Testnet USDH address. Mainnet: 0x111111a1a0667d36bD57c0A9f569b98057111111
USDH_TESTNET = '0x22222245c52C817f95b74664AE8546B490222222'

MAX_UINT256 = (1 << 256) - 1


# Requires env var API_KEY.
def get_single_signed_label_erc20():
    api_key = os.getenv('API_KEY')
    label = 'examplename'

    # Fail early if label cannot be normalized
    try:
        normalized_label = normalize_name(label)
        response = requests.post(
            'https://api.testnet.hlnames.xyz/sign_mintpass/' + normalized_label,
            headers={
                'X-API-Key': api_key,
                'Content-Type': 'application/json',
            },
            # Pass the ERC20 token address to price the mint in USDH instead of native HYPE.
            # Omitting `token` (or sending `"native"`) returns native pricing.
            json={'token': USDH_TESTNET},
        )

        if not response.ok:
            raise Exception(f'HTTP error! status: {response.status_code}')

        # minter_args types: { label, sig, timestamp, token, amountRequired }
        # For ERC20 mode `token` is the checksummed token address and `amountRequired` is
        # denominated in that token's base units (USDH = 6 decimals, so 20_000_000 == $20.00).
        minter_args = response.json()
        if 'sig' not in minter_args or minter_args['sig'] is None:
            raise Exception('Failed to get signature.')
        return minter_args
    except Exception as e:
        raise Exception(f'Error normalizing label, abort: {e}')


# Call Minter contract with minter_args
# Requires env var: TESTNET_MINTER_ADDRESS, TESTNET_PROVIDER_URL
minter_address = os.getenv('TESTNET_MINTER_ADDRESS')
provider_url = os.getenv('TESTNET_PROVIDER_URL')


def create_user_wallet_client(provider_url):
    w3 = Web3(Web3.HTTPProvider(provider_url))
    w3.eth.chain_id = 998
    return w3


def ensure_usdh_allowance(web3_client, user_address, minter_args):
    """Returns a built `approve(maxUint256)` transaction if current allowance is insufficient,
    otherwise None. Caller must sign + send + wait for receipt before submitting the mint tx.

    Approval strategy: this example approves `MAX_UINT256` so subsequent mints by the same user
    skip the approve step entirely (matches the production HLN frontend behavior). For an exact-
    amount approval per mint, substitute `int(minter_args['amountRequired'])` for `MAX_UINT256`
    below — the trade-off is one extra approve tx per mint.
    """
    token_address = to_checksum_address(minter_args['token'])
    amount_required = int(minter_args['amountRequired'])
    minter_checksum = to_checksum_address(minter_address)
    user_checksum = to_checksum_address(user_address)

    token_contract = web3_client.eth.contract(address=token_address, abi=erc20_abi)

    current_allowance = token_contract.functions.allowance(
        user_checksum, minter_checksum
    ).call()
    if current_allowance >= amount_required:
        return None

    return {
        'to': token_address,
        'value': 0,
        'data': token_contract.encodeABI(
            fn_name='approve', args=[minter_checksum, MAX_UINT256]
        ),
    }


def prepare_mint_erc20_transaction(minter_args, web3_client):
    """Build the `mintWithERC20` transaction. No value field and no slippage buffer — the API
    returns the exact USDH amount the contract will charge. Caller must ensure allowance first
    (see `ensure_usdh_allowance`).
    """
    minter_checksum = to_checksum_address(minter_address)
    minter_contract = web3_client.eth.contract(address=minter_checksum, abi=minter_abi)

    return {
        'to': minter_checksum,
        'value': 0,
        'data': minter_contract.encodeABI(
            fn_name='mintWithERC20',
            args=[
                minter_args['label'],
                minter_args.get('durationInYears', 1),
                minter_args['sig'],
                minter_args['timestamp'],
                to_checksum_address(minter_args['token']),
                '0x0000000000000000000000000000000000000000000000000000000000000000',  # Replace with referrer's namehash
            ],
        ),
    }
