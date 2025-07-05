// src/app/api/ccip-read/[...params]/route.ts - Production Version
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, Address, keccak256, encodePacked } from 'viem'
import { base } from 'viem/chains'

// YOUR DEPLOYED CONTRACT ADDRESS
const REGISTRY_ADDRESS = '0xa2bbe9b6a4ca01806b1cfac4174e4976ce2b0d70' as Address

// Base Mainnet public client
const basePublicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
})

// ContxRegistry ABI
const REGISTRY_ABI = [
  {
    inputs: [{ name: 'username', type: 'string' }],
    name: 'getAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'username', type: 'string' },
      { name: 'key', type: 'string' },
    ],
    name: 'getText',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'username', type: 'string' }],
    name: 'getProfile',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'usernameReturn', type: 'string' },
      { name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'username', type: 'string' }],
    name: 'isAvailable',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Proper namehash implementation
function namehash(name: string): string {
  if (name === '') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000'
  }
  
  const labels = name.split('.')
  let hash = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
  
  for (let i = labels.length - 1; i >= 0; i--) {
    const label = labels[i]
    const labelHash = keccak256(new TextEncoder().encode(label))
    hash = keccak256(encodePacked(['bytes32', 'bytes32'], [hash, labelHash]))
  }
  
  return hash
}

// Production username extraction
async function extractUsernameFromNode(node: string): Promise<string> {
  console.log('🔍 Extracting username for node:', node)
  
  // Common usernames to try (expand this list as needed)
  const commonUsernames = [
    'alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry',
    'test', 'demo', 'admin', 'user', 'dev', 'api', 'app', 'web', 
    'crypto', 'ens', 'base', 'eth', 'ai', 'chat', 'bot', 'agent',
    'john', 'jane', 'mike', 'sarah', 'david', 'emma', 'alex', 'lisa'
  ]
  
  // Try to find matching username
  for (const username of commonUsernames) {
    const calculatedNode = namehash(`${username}.contx.eth`)
    if (calculatedNode.toLowerCase() === node.toLowerCase()) {
      console.log('✅ Found username:', username)
      
      // Verify the username exists in registry
      try {
        const profile = await basePublicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'getProfile',
          args: [username],
        }) as [Address, string, boolean]
        
        if (profile[2]) { // exists = true
          return username
        }
      } catch {
        console.log('❌ Username not registered:', username)
      }
    }
  }
  
  console.log('❌ Username not found for node:', node)
  throw new Error(`Username not found for node: ${node}`)
}

// Main CCIP-Read handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    console.log('🌉 Production CCIP-Read Gateway Request')
    
    const resolvedParams = await params
    const [sender, data] = resolvedParams.params || []
    
    if (!sender || !data) {
      return NextResponse.json(
        { error: 'Missing sender or data parameters' },
        { status: 400 }
      )
    }

    console.log('📋 Request details:', { 
      sender, 
      dataLength: data.length,
      registry: REGISTRY_ADDRESS,
      network: 'Base Mainnet'
    })

    // Decode CCIP-Read data
    let decodedBytes: Buffer
    try {
      decodedBytes = Buffer.from(data.slice(2), 'hex')
    } catch {
      return NextResponse.json(
        { error: 'Invalid hex data' },
        { status: 400 }
      )
    }
    
    if (decodedBytes.length < 36) {
      return NextResponse.json(
        { error: 'Invalid CCIP-Read data length' },
        { status: 400 }
      )
    }

    const node = '0x' + decodedBytes.slice(0, 32).toString('hex')
    const selector = '0x' + decodedBytes.slice(32, 36).toString('hex')
    
    console.log('📊 Decoded:', { node, selector })

    // Extract username from node
    const username = await extractUsernameFromNode(node)
    console.log('👤 Username:', username)

    let result: string

    if (selector === '0x3b3b57de') {
      // addr(bytes32) - address resolution
      console.log('🏠 Resolving address for:', username)
      
      const address = await basePublicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getAddress',
        args: [username],
      }) as Address

      console.log('✅ Resolved address:', address)

      // Encode address as bytes32 (padded to 32 bytes)
      const addressBytes = Buffer.alloc(32)
      Buffer.from(address.slice(2), 'hex').copy(addressBytes, 12) // Address is 20 bytes, pad with 12 zeros
      result = '0x' + addressBytes.toString('hex')
      
    } else if (selector === '0x59d1d43c') {
      // text(bytes32,string) - text record resolution
      
      // Extract key parameter from the encoded data
      const keyLengthOffset = 36 + 32 // Skip node + selector + offset
      const keyLength = decodedBytes.readUInt32BE(keyLengthOffset + 28) // Last 4 bytes of length
      const keyStart = keyLengthOffset + 32
      const key = decodedBytes.slice(keyStart, keyStart + keyLength).toString('utf8')
      
      console.log('📝 Resolving text for:', username, 'key:', key)
      
      const textValue = await basePublicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getText',
        args: [username, key],
      }) as string

      console.log('✅ Resolved text value:', textValue)

      // Encode string result for ABI
      const stringBytes = Buffer.from(textValue, 'utf8')
      const lengthBytes = Buffer.alloc(32)
      lengthBytes.writeUInt32BE(stringBytes.length, 28) // Write length in last 4 bytes
      
      const paddingLength = 32 - (stringBytes.length % 32)
      const padding = paddingLength === 32 ? Buffer.alloc(0) : Buffer.alloc(paddingLength)
      
      const encodedResult = Buffer.concat([
        Buffer.alloc(32), // Offset (will be set below)
        lengthBytes,      // Length of string
        stringBytes,      // String data
        padding           // Padding to 32-byte boundary
      ])
      
      // Set offset to 32 (0x20)
      encodedResult.writeUInt32BE(32, 28)
      
      result = '0x' + encodedResult.toString('hex')
      
    } else {
      console.log('❌ Unsupported selector:', selector)
      return NextResponse.json(
        { error: `Function not supported: ${selector}` },
        { status: 404 }
      )
    }

    console.log('✅ CCIP-Read success for:', username)
    console.log('📤 Result length:', result.length)
    
    return NextResponse.json({ data: result })

  } catch (error) {
    console.error('❌ CCIP-Read error:', error)
    return NextResponse.json(
      { 
        error: 'Resolution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        registry: REGISTRY_ADDRESS,
        network: 'Base Mainnet'
      },
      { status: 500 }
    )
  }
}

// Health check and direct testing endpoint
export async function POST(request: NextRequest) {
  try {
    const { username, method, key } = await request.json()
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    let result: unknown

    switch (method) {
      case 'getProfile':
        result = await basePublicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'getProfile',
          args: [username],
        })
        break

      case 'getAddress':
        result = await basePublicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'getAddress',
          args: [username],
        })
        break

      case 'getText':
        if (!key) {
          return NextResponse.json({ error: 'Key required for getText' }, { status: 400 })
        }
        result = await basePublicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'getText',
          args: [username, key],
        })
        break

      case 'isAvailable':
        result = await basePublicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'isAvailable',
          args: [username],
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
    }

    return NextResponse.json({ 
      result, 
      success: true,
      registry: REGISTRY_ADDRESS,
      network: 'Base Mainnet',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      error: 'Query failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      registry: REGISTRY_ADDRESS,
      network: 'Base Mainnet'
    }, { status: 500 })
  }
}