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
