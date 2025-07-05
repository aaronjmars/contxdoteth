// src/app/api/ccip-read/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, Address } from 'viem'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, method, key } = body
    
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
          return NextResponse.json({ error: 'Key required' }, { status: 400 })
        }
        const textResult = await basePublicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'getText',
          args: [username, key],
        }) as string
        
        // Convert comma-separated to JSON for AI fields
        let processed: string = textResult
        if (key.startsWith('ai.') && textResult && !textResult.startsWith('[')) {
          const items = textResult.split(',').map(item => item.trim())
          processed = JSON.stringify(items)
        }
        
        result = { raw: textResult, processed }
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

  } catch (err) {
    return NextResponse.json({
      error: 'Query failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}