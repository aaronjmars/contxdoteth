import { createPublicClient, http, Address, keccak256, encodePacked } from 'viem'
import { mainnet, baseSepolia } from 'viem/chains'

// Base Sepolia Basenames Contract Addresses - OFFICIAL
export const BASE_ENS_ADDRESSES = {
  registry: '0x1493b2567056c2181630115660963E13A8E32735' as Address,
  baseRegistrar: '0xa0c70ec36c010b55e3c434d6c6ebeec50c705794' as Address,
  registrarController: '0x49ae3cc2e3aa768b1e5654f5d3c6002144a59581' as Address, // Main registration interface
  resolver: '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA' as Address, // L2Resolver
  reverseRegistrar: '0xa0A8401ECF248a9375a0a71C4dedc263dA18dCd7' as Address,
  priceOracle: '0x2b73408052825e17e0fe464f92de85e8c7723231' as Address,
  launchPriceOracle: '0x2afF926546f5fbe3E10315CC9C0827AF1A167aC8' as Address,
}

// Legacy alias for backward compatibility
export const BASE_ENS_ADDRESSES_LEGACY = {
  ...BASE_ENS_ADDRESSES,
  registrar: BASE_ENS_ADDRESSES.registrarController,
}

// Basenames resolver address for Base Sepolia
export const BASENAME_L2_RESOLVER_ADDRESS = '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA' as Address

export type Basename = `${string}.basetest.eth`

export enum BasenameTextRecordKeys {
  Description = 'description',
  Keywords = 'keywords', 
  Url = 'url',
  Email = 'email',
  Phone = 'phone',
  Github = 'com.github',
  Twitter = 'com.twitter',
  Farcaster = 'xyz.farcaster',
  Lens = 'xyz.lens',
  Telegram = 'org.telegram',
  Discord = 'com.discord',
  Avatar = 'avatar',
}


// Create public client for Base Sepolia (testnet)
export const basePublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'),
})




// Create public client for Ethereum mainnet (for ENS resolution)
export const mainnetPublicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
})

// Ethereum mainnet ENS addresses
export const MAINNET_ENS_ADDRESSES = {
  registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as Address,
  resolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41' as Address,
}

// ENS Resolver ABI for text records - Base L2 compatible
export const ENS_RESOLVER_ABI = [
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    name: 'text',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    name: 'setText',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'addr',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'addr', type: 'address' },
    ],
    name: 'setAddr',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'data', type: 'bytes[]' },
    ],
    name: 'multicall',
    outputs: [{ name: 'results', type: 'bytes[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'interfaceID', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ENS Registry ABI for reverse resolution
export const ENS_REGISTRY_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'resolver',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
    ],
    name: 'setResolver',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'owner', type: 'address' },
    ],
    name: 'setOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Base Registrar ABI (for ownership checks and Registry setup)
export const BASE_REGISTRAR_NFT_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'resolver', type: 'address' },
    ],
    name: 'setResolver',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'reclaim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Basenames RegistrarController ABI - Complete implementation
export const REGISTRAR_CONTROLLER_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
    ],
    name: 'registerPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
      { name: 'discountKey', type: 'bytes32' },
    ],
    name: 'discountedRegisterPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'owner', type: 'address' },
          { name: 'duration', type: 'uint256' },
          { name: 'resolver', type: 'address' },
          { name: 'data', type: 'bytes[]' },
          { name: 'reverseRecord', type: 'bool' },
        ],
        name: 'request',
        type: 'tuple',
      },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'owner', type: 'address' },
          { name: 'duration', type: 'uint256' },
          { name: 'resolver', type: 'address' },
          { name: 'data', type: 'bytes[]' },
          { name: 'reverseRecord', type: 'bool' },
        ],
        name: 'request',
        type: 'tuple',
      },
      { name: 'discountKey', type: 'bytes32' },
      { name: 'validationData', type: 'bytes' },
    ],
    name: 'discountedRegister',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'name', type: 'string' }],
    name: 'available',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'name', type: 'string' }],
    name: 'valid',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

// Legacy alias for backward compatibility
export const BASE_REGISTRAR_ABI = REGISTRAR_CONTROLLER_ABI

// Utility functions
export function namehash(name: string): `0x${string}` {
  // Proper ENS namehash implementation
  if (name === '') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000'
  }
  
  // Split the name into labels
  const labels = name.split('.')
  let hash = '0x0000000000000000000000000000000000000000000000000000000000000000'
  
  // Process labels from right to left (reverse order)
  for (let i = labels.length - 1; i >= 0; i--) {
    const label = labels[i]
    const labelHash = keccak256(new TextEncoder().encode(label))
    hash = keccak256(encodePacked(['bytes32', 'bytes32'], [hash as `0x${string}`, labelHash]))
  }
  
  return hash as `0x${string}`
}

// CRITICAL: This matches the RegistrarController's _setRecords calculation!
export function basenameNodehash(nameOnly: string): `0x${string}` {
  // This matches: keccak256(abi.encodePacked(rootNode, label))
  // Where rootNode = namehash('basetest.eth') and label = keccak256(nameOnly)
  const rootNode = namehash('basetest.eth')
  const label = keccak256(new TextEncoder().encode(nameOnly))
  return keccak256(encodePacked(['bytes32', 'bytes32'], [rootNode, label]))
}

export function isValidBasename(name: string): boolean {
  // Check if name is valid for .basetest.eth domain
  if (!name || name.length < 3) return false
  if (name.length > 63) return false
  if (name.startsWith('-') || name.endsWith('-')) return false
  if (!/^[a-z0-9-]+$/.test(name)) return false
  return true
}

export function formatBasename(name: string): string {
  // Format name for .basetest.eth domain
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '')
}



// AI Context schema for ENS text records
export interface AIContextRecord {
  'ai.bio': string // JSON array of bio lines
  'ai.style': string // JSON object with style preferences
  'ai.topics': string // JSON array of topics
  'ai.traits': string // JSON array of personality traits
  'ai.updated': string // ISO timestamp
  'ai.version': string // Context schema version
}

export function formatAIContextForENS(context: {
  bio?: string[]
  topics?: string[]
  traits?: string[]
  style?: { all?: string[] }
}): Record<string, string> {
  return {
    // Use standard BasenameTextRecordKeys where possible
    [BasenameTextRecordKeys.Description]: context.bio?.join('\n') || '',
    [BasenameTextRecordKeys.Keywords]: context.topics?.join(', ') || '',
    // Custom AI context records
    'ai.bio': JSON.stringify(context.bio || []),
    'ai.style': JSON.stringify(context.style || {}),
    'ai.topics': JSON.stringify(context.topics || []),
    'ai.traits': JSON.stringify(context.traits || []),
    'ai.updated': new Date().toISOString(),
    'ai.version': '1.0',
  }
}


// RegisterRequest type for Base Sepolia
export interface RegisterRequest {
  name: string
  owner: Address
  duration: bigint
  resolver: Address
  data: `0x${string}`[]
  reverseRecord: boolean
}

// Function to resolve ENS name from address (using Ethereum mainnet)
export async function resolveENSName(address: Address): Promise<string | null> {
  try {
    // Use viem's built-in ENS resolution for mainnet
    const ensName = await mainnetPublicClient.getEnsName({ address })
    return ensName
  } catch (error) {
    console.warn('Failed to resolve ENS name for address:', address, error)
    return null
  }
}