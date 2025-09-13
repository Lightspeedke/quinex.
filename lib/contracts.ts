// Centralized contract addresses and ABI imports
import DEXABI from "@/components/abi/DEX.json"

// Contract Addresses
export const CONTRACTS = {
  // Airdrop/Claim Contract (DEX)
  AIRDROP: "0x90cEdC950359Dbb5fa2fA2d32E686b2d9E10B75C",

  // Token Contract
  TOKEN: "0x029A50BC15da765Dc45861e416AD9644f87e52Ec",

  // Staking Contract
  STAKING: "0x64cC8eE6b4C2C8196dF62098c307e6991a8b2D1E",
} as const

// ABI Exports
export const ABIS = {
  DEX: DEXABI,
  STAKING: [
    {
      inputs: [{ internalType: "uint256", name: "stakeId", type: "uint256" }],
      name: "claimReward",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "stakeId", type: "uint256" }],
      name: "exit",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "user", type: "address" }],
      name: "stakesOf",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "uint256", name: "startTime", type: "uint256" },
            { internalType: "uint8", name: "tierId", type: "uint8" },
            { internalType: "bool", name: "withdrawn", type: "bool" },
            { internalType: "bool", name: "rewardClaimed", type: "bool" },
          ],
          internalType: "struct TimeLockedStaking.Stake[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "user", type: "address" },
        { internalType: "uint256", name: "stakeId", type: "uint256" },
      ],
      name: "pendingReward",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint8", name: "tierId", type: "uint8" }],
      name: "tierInfo",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "lockDuration", type: "uint256" },
            { internalType: "uint256", name: "aprBps", type: "uint256" },
            { internalType: "bool", name: "active", type: "bool" },
          ],
          internalType: "struct TimeLockedStaking.Tier",
          name: "",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "stakeId", type: "uint256" }],
      name: "withdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint8", name: "tierId", type: "uint8" },
      ],
      name: "stake",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "token",
      outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ],
  ERC20: [
    {
      type: "function",
      name: "approve",
      stateMutability: "nonpayable",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ type: "bool" }],
    },
    {
      type: "function",
      name: "allowance",
      stateMutability: "view",
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      outputs: [{ type: "uint256" }],
    },
    {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ type: "uint256" }],
    },
    { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
    { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
    { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  ],
} as const

// RPC Endpoints for World Chain
export const RPC_ENDPOINTS = [
  "https://worldchain-mainnet.g.alchemy.com/public",
  "https://worldchain.drpc.org",
  "https://480.rpc.thirdweb.com",
  "https://worldchain-mainnet.public.blastapi.io",
  "https://worldchain-mainnet.gateway.tenderly.co/",
] as const

// World Chain Configuration
export const WORLD_CHAIN_PARAMS = {
  chainId: "0x1e0", // 480
  chainName: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: RPC_ENDPOINTS,
  blockExplorerUrls: ["https://worldscan.org"],
} as const
