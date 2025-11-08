leftover

  {
    name: 'mintWithERC20',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { type: 'string', name: 'label' },
      { type: 'uint256', name: 'durationInYears' },
      { type: 'bytes', name: 'sig' },
      { type: 'uint256', name: 'timestamp' },
      { type: 'address', name: 'token' },
      { type: 'bytes32', name: 'referral' },
    ],
    outputs: [],
  },


  interface IHLN_RefMinter {
    function mintWithERC20(string calldata label, uint256 durationInYears, bytes calldata sig, uint256 timestamp, address token, bytes32 referral) external payable;
  }