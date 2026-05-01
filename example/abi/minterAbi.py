minter_abi = [
    {
        "name": "mintWithNative",
        "type": "function",
        "stateMutability": "payable",
        "inputs": [
            {"type": "string", "name": "label"},
            {"type": "uint256", "name": "durationInYears"},
            {"type": "bytes", "name": "sig"},
            {"type": "uint256", "name": "timestamp"},
            {"type": "bytes32", "name": "referral"},
        ],
        "outputs": [],
    },
    {
        "name": "mintWithERC20",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"type": "string", "name": "label"},
            {"type": "uint256", "name": "durationInYears"},
            {"type": "bytes", "name": "sig"},
            {"type": "uint256", "name": "timestamp"},
            {"type": "address", "name": "token"},
            {"type": "bytes32", "name": "referral"},
        ],
        "outputs": [],
    },
    {
        "name": "getPriceOfNativeInUSD",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256",
            },
        ],
    },
]

# Minimal ERC20 fragments needed for approve + allowance lookup when paying with USDH.
erc20_abi = [
    {
        "name": "approve",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"type": "address", "name": "spender"},
            {"type": "uint256", "name": "amount"},
        ],
        "outputs": [{"type": "bool", "name": ""}],
    },
    {
        "name": "allowance",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {"type": "address", "name": "owner"},
            {"type": "address", "name": "spender"},
        ],
        "outputs": [{"type": "uint256", "name": ""}],
    },
    {
        "name": "decimals",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"type": "uint8", "name": ""}],
    },
]
