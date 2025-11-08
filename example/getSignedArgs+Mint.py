import os
import requests
from web3 import Web3
from web3.ens import normalize_name
from eth_utils import to_checksum_address
from web3.contract import Contract
from .abi.minterAbi import minter_abi

# Get signature + minter arguments from API call

# Requires env var API_KEY.
def get_single_signed_label():
    api_key = os.getenv('API_KEY')
    label = 'examplename'

    # Fail early if label cannot be normalized
    try:
        normalized_label = normalize_name(label)
        response = requests.post(
            'https://api.testnet.hlnames.xyz/private/sign_mintpass/' + normalized_label,
            headers={
                'X-API-Key': api_key,
                'Content-Type': 'application/json'
            },
        )

        if not response.ok:
            raise Exception(f'HTTP error! status: {response.status_code}')

        # minter_args types: {label: string, sig: string, timestamp: number, amountRequired: string, referral_hash: string}
        minter_args = response.json()
        if 'sig' not in minter_args or minter_args['sig'] is None:
            raise Exception("Failed to get signature.")
        else:
            return minter_args
    except Exception as e:
        raise Exception(f"Error normalizing label, abort: {e}")

# Call Minter contract with minter_args
# Requires env var: TESTNET_MINTER_ADDRESS
minter_address = os.getenv('TESTNET_MINTER_ADDRESS')
provider_url = os.getenv('TESTNET_PROVIDER_URL')

# For production dApp with user wallet
def create_user_wallet_client(provider_url):
    w3 = Web3(Web3.HTTPProvider(provider_url))
    w3.eth.chain_id = 998
    return w3

def prepare_mint_transaction(minter_args, web3_client):
    # API returns amountRequired as string to preserve precision for large values
    amount_required = int(minter_args['amountRequired'])

    # Add in 2% slippage to the HYPE/USD rate, in case of oracle volatility.
    # N.B. Should be refunded to payer if unfilled
    slippage_percentage = 2  # 2%
    hundred = 100
    payment_value = amount_required * (hundred + slippage_percentage) // hundred

    # Create contract instance
    minter_contract = web3_client.eth.contract(
        address=to_checksum_address(minter_address),
        abi=minter_abi
    )

    # Return transaction object for user wallet to sign
    return {
        'to': to_checksum_address(minter_address),
        'value': payment_value,
        'data': minter_contract.encodeABI(
            fn_name='mintWithNative',
            args=[
                minter_args['label'],
                minter_args.get('durationInYears', 1),  # Default to 1 if not provided
                minter_args['sig'],
                minter_args['timestamp'],
                minter_args['referral_hash'],
            ]
        ),
    }
