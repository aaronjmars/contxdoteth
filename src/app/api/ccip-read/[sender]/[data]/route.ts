import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, Address, decodeAbiParameters, fallback } from 'viem'
import { base } from 'viem/chains' // Base mainnet

const CONTX_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_BASE_REGISTRY_ADDRESS as Address

const basePublicClient = createPublicClient({
  chain: base,
  transport: fallback([
    http('https://base.llamarpc.com'),
    http('https://mainnet.base.org'),
    http('https://base.gateway.tenderly.co'),
    http('https://base-mainnet.g.alchemy.com/v2/demo'),
  ]),
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

// Cache to avoid repeated contract calls
let usernamesCache: string[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Get all registered usernames from your contract
async function getAllUsernames(): Promise<string[]> {
  const now = Date.now()
  
  // Return cached usernames if still fresh
  if (usernamesCache && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('📋 Using cached usernames:', usernamesCache)
    return usernamesCache
  }

  console.log('🔍 Fetching all usernames from contract events...')
  console.log('📋 Contract address:', CONTX_REGISTRY_ADDRESS)
  console.log('📋 Chain:', basePublicClient.chain?.name)
  console.log('📋 Chain ID:', basePublicClient.chain?.id)
  
  try {
    // Get from SubdomainRegistered events
    console.log('📋 Querying SubdomainRegistered events from block 0...')
    
    const events = await basePublicClient.getContractEvents({
      address: CONTX_REGISTRY_ADDRESS,
      abi: [
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'username', type: 'string' },
            { indexed: true, name: 'owner', type: 'address' }
          ],
          name: 'SubdomainRegistered',
          type: 'event'
        }
      ],
      eventName: 'SubdomainRegistered',
      fromBlock: BigInt(0)
    })
    
    console.log(`📋 Raw events found: ${events.length}`)
    events.forEach((event, i) => {
      console.log(`📋 Event ${i}:`, {
        username: event.args.username,
        owner: event.args.owner,
        blockNumber: event.blockNumber
      })
    })
    
    const usernames = events.map(event => event.args.username).filter(Boolean) as string[]
    
    console.log(`📋 Extracted ${usernames.length} usernames:`, usernames)
    
    // Cache the results
    usernamesCache = usernames
    cacheTimestamp = now
    
    return usernames
    
  } catch (error) {
    console.error('❌ Error fetching usernames from events:', error)
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Find username by comparing namehashes
async function findUsernameFromNode(node: string): Promise<string> {
  console.log('🔍 Looking for username for node:', node)
  
  const usernames = await getAllUsernames()
  console.log(`🔍 Checking ${usernames.length} usernames against node...`)
  
  // Import namehash function
  const { namehash } = await import('viem')
  
  // Check each username
  for (const username of usernames) {
    const expectedNode = namehash(`${username}.contx.eth`)
    
    console.log(`🔍 Checking "${username}":`)
    console.log(`   Expected: ${expectedNode}`)
    console.log(`   Received: ${node}`)
    console.log(`   Match: ${expectedNode.toLowerCase() === node.toLowerCase()}`)
    
    if (expectedNode.toLowerCase() === node.toLowerCase()) {
      console.log('✅ Found matching username:', username)
      return username
    }
  }
  
  console.log('❌ No matching username found for node:', node)
  console.log('❌ Available usernames:', usernames)
  throw new Error(`Username not found for node: ${node}`)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sender: string; data: string }> }
) {
  try {
    const { sender, data } = await params
    
    console.log('🌉 CCIP-Read request started')
    console.log('📤 Sender:', sender)
    console.log('📦 Data:', data)
    console.log('📦 Data length:', data.length)
    
    const callData = Buffer.from(data.slice(2), 'hex')
    const selector = '0x' + callData.slice(0, 4).toString('hex')
    
    console.log('🎯 Function selector:', selector)
    console.log('📦 Call data length:', callData.length)

    let result: string

    if (selector === '0x3b3b57de') {
      // addr(bytes32) - Address resolution
      console.log('📍 Processing address resolution...')
      
      const node = '0x' + callData.slice(4, 36).toString('hex')
      console.log('🔗 Extracted node:', node)
      
      const username = await findUsernameFromNode(node)
      console.log('👤 Resolved username:', username)
      
      console.log('📍 Calling getAddress on contract...')
      const address = await basePublicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getAddress',
        args: [username],
      }) as Address

      console.log('📍 Contract returned address:', address)

      // Encode as 32-byte value
      const addressBytes = Buffer.alloc(32)
      Buffer.from(address.slice(2), 'hex').copy(addressBytes, 12)
      result = '0x' + addressBytes.toString('hex')
      console.log('📍 Encoded result:', result)
      
    } else if (selector === '0x59d1d43c') {
      // text(bytes32,string) - Text record resolution
      console.log('📝 Processing text record resolution...')
      
      const parametersData = ('0x' + callData.slice(4).toString('hex')) as `0x${string}`
      console.log('📝 Parameters data:', parametersData)
      
      const decoded = decodeAbiParameters(
        [
          { name: 'node', type: 'bytes32' },
          { name: 'key', type: 'string' }
        ],
        parametersData
      )
      
      const node = decoded[0] as string
      const key = decoded[1] as string
      
      console.log('🔗 Decoded node:', node)
      console.log('🔑 Decoded key:', key)
      
      const username = await findUsernameFromNode(node)
      console.log('👤 Resolved username:', username)
      
      console.log('📝 Calling getText on contract...')
      const textValue = await basePublicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getText',
        args: [username, key],
      }) as string
      
      console.log('📄 Contract returned text:', `"${textValue}"`)
      console.log('📄 Text length:', textValue.length)

      // Convert to JSON for AI fields if needed
      let processedValue = textValue
      if (key.startsWith('ai.') && textValue && !textValue.startsWith('[') && !textValue.startsWith('{')) {
        const items = textValue.split(',').map(item => item.trim())
        processedValue = JSON.stringify(items)
        console.log('🔄 Converted to JSON:', processedValue)
      }

      console.log('📝 Final processed value:', `"${processedValue}"`)

      // Encode string response for CCIP-Read
      const stringBytes = Buffer.from(processedValue, 'utf8')
      const lengthBytes = Buffer.alloc(32)
      lengthBytes.writeUInt32BE(stringBytes.length, 28)
      
      const paddingLength = (32 - (stringBytes.length % 32)) % 32
      const padding = paddingLength > 0 ? Buffer.alloc(paddingLength) : Buffer.alloc(0)
      
      const encodedResult = Buffer.concat([
        Buffer.from('0000000000000000000000000000000000000000000000000000000000000020', 'hex'),
        lengthBytes,
        stringBytes,
        padding
      ])
      
      result = '0x' + encodedResult.toString('hex')
      console.log('📝 Encoded result length:', result.length)
      console.log('📝 Encoded result preview:', result.slice(0, 100) + '...')
      
    } else {
      console.log('❌ Unsupported function selector:', selector)
      return NextResponse.json({ 
        error: `Function not supported: ${selector}` 
      }, { status: 404 })
    }

    console.log('✅ CCIP-Read completed successfully!')
    return NextResponse.json({ data: result }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('❌ CCIP-Read error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({
      error: 'Resolution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
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

// Debug endpoint for direct testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, username, key, node } = body
    
    console.log('🧪 Debug POST request:', { action, username, key, node })

    if (action === 'test-usernames') {
      console.log('🧪 Testing username discovery...')
      const usernames = await getAllUsernames()
      return NextResponse.json({ 
        success: true, 
        usernames,
        count: usernames.length 
      })
    }

    if (action === 'test-namehash' && username) {
      console.log('🧪 Testing namehash calculation...')
      const { namehash } = await import('viem')
      const calculatedNode = namehash(`${username}.contx.eth`)
      return NextResponse.json({ 
        success: true, 
        username,
        domain: `${username}.contx.eth`,
        namehash: calculatedNode
      })
    }

    if (action === 'test-address' && username) {
      console.log('🧪 Testing address resolution...')
      const address = await basePublicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getAddress',
        args: [username],
      }) as Address
      return NextResponse.json({ 
        success: true, 
        username,
        address
      })
    }

    if (action === 'test-text' && username && key) {
      console.log('🧪 Testing text resolution...')
      const textValue = await basePublicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getText',
        args: [username, key],
      }) as string
      return NextResponse.json({ 
        success: true, 
        username,
        key,
        value: textValue,
        length: textValue.length
      })
    }

    if (action === 'test-node-lookup' && node) {
      console.log('🧪 Testing node to username lookup...')
      const username = await findUsernameFromNode(node)
      return NextResponse.json({ 
        success: true, 
        node,
        username
      })
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use: test-usernames, test-namehash, test-address, test-text, test-node-lookup' 
    }, { status: 400 })

  } catch (error) {
    console.error('🧪 Debug POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

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