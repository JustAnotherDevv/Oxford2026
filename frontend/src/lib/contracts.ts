export const PRIVATE_POOL_ADDRESS = import.meta.env.VITE_PRIVATE_POOL_ADDRESS as `0x${string}`;
export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS as `0x${string}`;

export const privatePoolAbi = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "commitment", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transact",
    inputs: [
      { name: "proof", type: "bytes" },
      { name: "publicInputs", type: "bytes32[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "proof", type: "bytes" },
      { name: "publicInputs", type: "bytes32[]" },
      { name: "recipient", type: "address" },
      { name: "withdrawAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getLastRoot",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextLeafIndex",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "token",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nullifierUsed",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "commitment", type: "bytes32", indexed: true },
      { name: "leafIndex", type: "uint256", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Transact",
    inputs: [
      { name: "nullifier1", type: "bytes32", indexed: false },
      { name: "nullifier2", type: "bytes32", indexed: false },
      { name: "commitment1", type: "bytes32", indexed: false },
      { name: "commitment2", type: "bytes32", indexed: false },
      { name: "encryptedValue1", type: "bytes32", indexed: false },
      { name: "encryptedValue2", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawal",
    inputs: [
      { name: "nullifier", type: "bytes32", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "LeafInserted",
    inputs: [
      { name: "commitment", type: "bytes32", indexed: true },
      { name: "leafIndex", type: "uint256", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;
