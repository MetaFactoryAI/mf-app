export const MerkleRedeemAddress = {};

export const MerkleRedeemABI = [
  {
    inputs: [{ internalType: 'address', name: '_token', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: '_claimant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_balance',
        type: 'uint256',
      },
    ],
    name: 'Claimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'address', name: '_liquidityProvider', type: 'address' },
      { internalType: 'uint256', name: '_begin', type: 'uint256' },
      { internalType: 'uint256', name: '_end', type: 'uint256' },
    ],
    name: 'claimStatus',
    outputs: [{ internalType: 'bool[]', name: '', type: 'bool[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_liquidityProvider', type: 'address' },
      { internalType: 'uint256', name: '_week', type: 'uint256' },
      { internalType: 'uint256', name: '_claimedBalance', type: 'uint256' },
      { internalType: 'bytes32[]', name: '_merkleProof', type: 'bytes32[]' },
    ],
    name: 'claimWeek',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_liquidityProvider', type: 'address' },
      {
        components: [
          { internalType: 'uint256', name: 'week', type: 'uint256' },
          { internalType: 'uint256', name: 'balance', type: 'uint256' },
          { internalType: 'bytes32[]', name: 'merkleProof', type: 'bytes32[]' },
        ],
        internalType: 'struct MerkleRedeem.Claim[]',
        name: 'claims',
        type: 'tuple[]',
      },
    ],
    name: 'claimWeeks',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'claimed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_begin', type: 'uint256' },
      { internalType: 'uint256', name: '_end', type: 'uint256' },
    ],
    name: 'merkleRoots',
    outputs: [{ internalType: 'bytes32[]', name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_week', type: 'uint256' },
      { internalType: 'bytes32', name: '_merkleRoot', type: 'bytes32' },
      { internalType: 'uint256', name: '_totalAllocation', type: 'uint256' },
    ],
    name: 'seedAllocations',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_liquidityProvider', type: 'address' },
      { internalType: 'uint256', name: '_week', type: 'uint256' },
      { internalType: 'uint256', name: '_claimedBalance', type: 'uint256' },
      { internalType: 'bytes32[]', name: '_merkleProof', type: 'bytes32[]' },
    ],
    name: 'verifyClaim',
    outputs: [{ internalType: 'bool', name: 'valid', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'weekMerkleRoots',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
