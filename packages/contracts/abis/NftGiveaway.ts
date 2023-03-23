export const NftGiveawayAddress = {
  mainnet: '0x',
};

export const NftGiveawayAbi = [
  {
    inputs: [{ internalType: 'address', name: 'admin', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        components: [
          { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
          {
            internalType: 'uint256[]',
            name: 'values',
            type: 'uint256[]',
          },
          {
            internalType: 'address',
            name: 'contractAddress',
            type: 'address',
          },
        ],
        indexed: false,
        internalType: 'struct ClaimERC1155ERC721ERC20.ERC1155Claim[]',
        name: 'erc1155',
        type: 'tuple[]',
      },
      {
        components: [
          { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
          {
            internalType: 'address',
            name: 'contractAddress',
            type: 'address',
          },
        ],
        indexed: false,
        internalType: 'struct ClaimERC1155ERC721ERC20.ERC721Claim[]',
        name: 'erc721',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'uint256[]',
            name: 'amounts',
            type: 'uint256[]',
          },
          {
            internalType: 'address[]',
            name: 'contractAddresses',
            type: 'address[]',
          },
        ],
        indexed: false,
        internalType: 'struct ClaimERC1155ERC721ERC20.ERC20Claim',
        name: 'erc20',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'merkleRoot',
        type: 'bytes32',
      },
    ],
    name: 'ClaimedMultipleTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'merkleRoot',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'expiryTime',
        type: 'uint256',
      },
    ],
    name: 'NewGiveaway',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32',
      },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'merkleRoot', type: 'bytes32' },
      { internalType: 'uint256', name: 'expiryTime', type: 'uint256' },
    ],
    name: 'addNewGiveaway',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'merkleRoot', type: 'bytes32' },
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          {
            components: [
              {
                internalType: 'uint256[]',
                name: 'ids',
                type: 'uint256[]',
              },
              {
                internalType: 'uint256[]',
                name: 'values',
                type: 'uint256[]',
              },
              {
                internalType: 'address',
                name: 'contractAddress',
                type: 'address',
              },
            ],
            internalType: 'struct ClaimERC1155ERC721ERC20.ERC1155Claim[]',
            name: 'erc1155',
            type: 'tuple[]',
          },
          {
            components: [
              {
                internalType: 'uint256[]',
                name: 'ids',
                type: 'uint256[]',
              },
              {
                internalType: 'address',
                name: 'contractAddress',
                type: 'address',
              },
            ],
            internalType: 'struct ClaimERC1155ERC721ERC20.ERC721Claim[]',
            name: 'erc721',
            type: 'tuple[]',
          },
          {
            components: [
              {
                internalType: 'uint256[]',
                name: 'amounts',
                type: 'uint256[]',
              },
              {
                internalType: 'address[]',
                name: 'contractAddresses',
                type: 'address[]',
              },
            ],
            internalType: 'struct ClaimERC1155ERC721ERC20.ERC20Claim',
            name: 'erc20',
            type: 'tuple',
          },
          { internalType: 'bytes32', name: 'salt', type: 'bytes32' },
        ],
        internalType: 'struct ClaimERC1155ERC721ERC20.Claim',
        name: 'claim',
        type: 'tuple',
      },
      { internalType: 'bytes32[]', name: 'proof', type: 'bytes32[]' },
    ],
    name: 'claimMultipleTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32[]',
        name: 'rootHashes',
        type: 'bytes32[]',
      },
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          {
            components: [
              {
                internalType: 'uint256[]',
                name: 'ids',
                type: 'uint256[]',
              },
              {
                internalType: 'uint256[]',
                name: 'values',
                type: 'uint256[]',
              },
              {
                internalType: 'address',
                name: 'contractAddress',
                type: 'address',
              },
            ],
            internalType: 'struct ClaimERC1155ERC721ERC20.ERC1155Claim[]',
            name: 'erc1155',
            type: 'tuple[]',
          },
          {
            components: [
              {
                internalType: 'uint256[]',
                name: 'ids',
                type: 'uint256[]',
              },
              {
                internalType: 'address',
                name: 'contractAddress',
                type: 'address',
              },
            ],
            internalType: 'struct ClaimERC1155ERC721ERC20.ERC721Claim[]',
            name: 'erc721',
            type: 'tuple[]',
          },
          {
            components: [
              {
                internalType: 'uint256[]',
                name: 'amounts',
                type: 'uint256[]',
              },
              {
                internalType: 'address[]',
                name: 'contractAddresses',
                type: 'address[]',
              },
            ],
            internalType: 'struct ClaimERC1155ERC721ERC20.ERC20Claim',
            name: 'erc20',
            type: 'tuple',
          },
          { internalType: 'bytes32', name: 'salt', type: 'bytes32' },
        ],
        internalType: 'struct ClaimERC1155ERC721ERC20.Claim[]',
        name: 'claims',
        type: 'tuple[]',
      },
      { internalType: 'bytes32[][]', name: 'proofs', type: 'bytes32[][]' },
    ],
    name: 'claimMultipleTokensFromMultipleMerkleTree',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    name: 'claimed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'bytes32[]', name: 'rootHashes', type: 'bytes32[]' },
    ],
    name: 'getClaimedStatus',
    outputs: [{ internalType: 'bool[]', name: '', type: 'bool[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    name: 'leaves',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC721BatchReceived',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];
