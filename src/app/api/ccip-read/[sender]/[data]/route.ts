import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, Address, keccak256, encodePacked } from 'viem'
import { base } from 'viem/chains'

const REGISTRY_ADDRESS = '0xa2bbe9b6a4ca01806b1cfac4174e4976ce2b0d70' as Address

const basePublicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
})

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
] as const

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

// Simple function to extract username from ENS node
async function extractUsernameFromNode(node: string): Promise<string> {
  console.log('🔍 Extracting username from node:', node)
  
  // Try common usernames first + any specific test cases
  const commonUsernames = ['aaron', 'alice', 'bob', 'test', 'demo', 'charlie', 'diana', 'john', 'jane', 'admin', 'user', 'testuser', 'example', 'dev']
  
  for (const username of commonUsernames) {
    const calculatedNode = namehash(`${username}.contx.eth`)
    if (calculatedNode.toLowerCase() === node.toLowerCase()) {
      console.log('✅ Found username:', username)
      return username
    }
  }
  
  // If not found in common names, we need a different approach
  throw new Error(`Username extraction failed for node: ${node}. Consider adding the username to common list or implementing a proper reverse lookup.`)
}

// Handle CCIP-Read requests from ENS resolver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sender: string; data: string }> }
) {
  try {
    const { sender, data } = await params
    
    console.log('🌉 CCIP-Read request:', { sender, data })
    
    let decodedBytes: Buffer
    try {
      decodedBytes = Buffer.from(data.slice(2), 'hex')
    } catch {
      return NextResponse.json({ error: 'Invalid hex data' }, { status: 400 })
    }
    
    if (decodedBytes.length < 36) {
      return NextResponse.json({ error: 'Invalid data length' }, { status: 400 })
    }

    const node = '0x' + decodedBytes.slice(0, 32).toString('hex')
    const selector = '0x' + decodedBytes.slice(32, 36).toString('hex')

    const username = await extractUsernameFromNode(node)
    console.log('👤 Username:', username)

    let result: string

    if (selector === '0x3b3b57de') {
      // addr(bytes32) - address resolution
      const address = await basePublicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getAddress',
        args: [username],
      }) as Address

      const addressBytes = Buffer.alloc(32)
      Buffer.from(address.slice(2), 'hex').copy(addressBytes, 12)
      result = '0x' + addressBytes.toString('hex')
      
    } else if (selector === '0x59d1d43c') {
      // text(bytes32,string) - text record resolution
      const keyLengthOffset = 36 + 32
      const keyLength = decodedBytes.readUInt32BE(keyLengthOffset + 28)
      const keyStart = keyLengthOffset + 32
      const key = decodedBytes.slice(keyStart, keyStart + keyLength).toString('utf8')
      
      console.log('📝 Resolving text for key:', key)
      
      const textValue = await basePublicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getText',
        args: [username, key],
      }) as string

      // Convert comma-separated to JSON for AI fields
      let processedValue = textValue
      if (key.startsWith('ai.') && textValue && !textValue.startsWith('[')) {
        const items = textValue.split(',').map(item => item.trim())
        processedValue = JSON.stringify(items)
      }

      const stringBytes = Buffer.from(processedValue, 'utf8')
      const lengthBytes = Buffer.alloc(32)
      lengthBytes.writeUInt32BE(stringBytes.length, 28)
      
      const paddingLength = 32 - (stringBytes.length % 32)
      const padding = paddingLength === 32 ? Buffer.alloc(0) : Buffer.alloc(paddingLength)
      
      const encodedResult = Buffer.concat([
        Buffer.alloc(32),
        lengthBytes,
        stringBytes,
        padding
      ])
      
      encodedResult.writeUInt32BE(32, 28)
      result = '0x' + encodedResult.toString('hex')
      
    } else {
      return NextResponse.json({ error: `Function not supported: ${selector}` }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }

    console.log('✅ CCIP-Read success for:', username)
    return NextResponse.json({ data: result }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (err) {
    console.error('❌ CCIP-Read error:', err)
    return NextResponse.json({
      error: 'Resolution failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}