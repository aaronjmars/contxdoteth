import { createPublicClient, http, Address } from 'viem'
import { base } from 'viem/chains'

// Base L2 ENS Contract Addresses
export const BASE_ENS_ADDRESSES = {
  // These are the actual Base mainnet ENS addresses
  registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as Address,
  resolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41' as Address, // Base public resolver
  registrar: '0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb' as Address, // Base registrar controller
}

// Create public client for Base
export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
})

// ENS Resolver ABI for text records
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
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'keys', type: 'string[]' },
      { name: 'values', type: 'string[]' },
    ],
    name: 'multicall',
    outputs: [{ name: 'results', type: 'bytes[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Base Registrar Controller ABI for registration
export const BASE_REGISTRAR_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
    ],
    name: 'rentPrice',
    outputs: [
      {
        components: [
          { name: 'base', type: 'uint256' },
          { name: 'premium', type: 'uint256' },
        ],
        name: 'price',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'secret', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
      { name: 'data', type: 'bytes[]' },
      { name: 'reverseRecord', type: 'bool' },
      { name: 'fuses', type: 'uint16' },
      { name: 'wrapperExpiry', type: 'uint64' },
    ],
    name: 'register',
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
] as const

// Utility functions
export function namehash(name: string): `0x${string}` {
  // Simple namehash implementation for now
  // In a real implementation, use @ensdomains/ensjs properly
  if (name === '') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000'
  }
  
  // For demo purposes, return a simple hash
  // This should be replaced with proper ENS namehash
  const hash = Array.from(name)
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString(16)
    .padStart(64, '0')
  
  return `0x${hash}` as `0x${string}`
}

export function isValidBasename(name: string): boolean {
  // Check if name is valid for .base.eth domain
  if (!name || name.length < 3) return false
  if (name.length > 63) return false
  if (name.startsWith('-') || name.endsWith('-')) return false
  if (!/^[a-z0-9-]+$/.test(name)) return false
  return true
}

export function formatBasename(name: string): string {
  // Format name for .base.eth domain
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
}): AIContextRecord {
  return {
    'ai.bio': JSON.stringify(context.bio || []),
    'ai.style': JSON.stringify(context.style || {}),
    'ai.topics': JSON.stringify(context.topics || []),
    'ai.traits': JSON.stringify(context.traits || []),
    'ai.updated': new Date().toISOString(),
    'ai.version': '1.0',
  }
}

export function parseAIContextFromENS(records: Record<string, string>) {
  try {
    return {
      bio: records['ai.bio'] ? JSON.parse(records['ai.bio']) : [],
      style: records['ai.style'] ? JSON.parse(records['ai.style']) : {},
      topics: records['ai.topics'] ? JSON.parse(records['ai.topics']) : [],
      traits: records['ai.traits'] ? JSON.parse(records['ai.traits']) : [],
      updated: records['ai.updated'] || null,
      version: records['ai.version'] || '1.0',
    }
  } catch (error) {
    console.error('Error parsing AI context from ENS:', error)
    return null
  }
}