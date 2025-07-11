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
    
    // For indexed strings, we need to get the actual data from the transaction logs
    // Let's try a different approach - get ALL logs and decode manually
    const logs = await basePublicClient.getLogs({
      address: CONTX_REGISTRY_ADDRESS,
      fromBlock: BigInt(0),
      toBlock: 'latest'
    })
    
    console.log(`📋 Raw logs found: ${logs.length}`)
    
    const usernames: string[] = []
    
    // Decode each log manually to get the actual username string
    for (const log of logs) {
      try {
        // Check if this is a SubdomainRegistered event
        if (log.topics[0] === '0x66f79d321098f331689118429a90f81eaf47968e7edb58b0bf2479bed8bded65') {
          // Decode the log data (non-indexed parameters)
          // Since username is indexed, we need a different approach
          
          // For now, let's extract from transaction input data
          console.log('📋 Found SubdomainRegistered log:', {
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            topics: log.topics,
            data: log.data
          })
          
          // Get the transaction to see the function call
          const tx = await basePublicClient.getTransaction({
            hash: log.transactionHash
          })
          
          console.log('📋 Transaction input:', tx.input)
          
          // Try to decode the register function call to get the username
          // This is a fallback approach
          if (tx.input && tx.input.length > 10) {
            try {
              // If this is a register call, decode it
              const decoded = decodeAbiParameters(
                [
                  { name: 'username', type: 'string' },
                  { name: 'name', type: 'string' },
                  { name: 'bio', type: 'string' }
                ],
                ('0x' + tx.input.slice(10)) as `0x${string}` // Remove function selector
              )
              
              const username = decoded[0] as string
              console.log('📋 Decoded username from tx:', username)
              
              if (username && !usernames.includes(username)) {
                usernames.push(username)
              }
            } catch (decodeError) {
              console.log('📋 Could not decode transaction input:', decodeError)
            }
          }
        }
      } catch (logError) {
        console.log('📋 Error processing log:', logError)
        continue
      }
    }
    
    console.log(`📋 Extracted ${usernames.length} usernames:`, usernames)
    
    // If we couldn't get usernames from transaction data, fall back to a simpler approach
    if (usernames.length === 0) {
      console.log('📋 Falling back to common username testing...')
      
      // Test common usernames by calling the contract directly
      const testUsernames = ['aaron', 'alice', 'bob', 'test', 'demo', 'admin', 'user', 'dev']
      
      for (const testUsername of testUsernames) {
        try {
          const profile = await basePublicClient.readContract({
            address: CONTX_REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            functionName: 'getProfile',
            args: [testUsername],
          }) as [Address, string, boolean]
          
          if (profile[2]) { // exists = true
            usernames.push(testUsername)
            console.log('📋 Found existing username:', testUsername)
          }
        } catch {
          // Username doesn't exist, continue
        }
      }
    }
    
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
  
  // Instead of throwing error, return a specific error that we can handle
  throw new Error(`DOMAIN_NOT_FOUND: No username found for node ${node}. Available: [${usernames.join(', ')}]`)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sender: string; data: string }> }
) {
  // Add CORS headers to all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  try {
    const { sender, data } = await params
    
    console.log('🌉 CCIP-Read request started')
    console.log('📤 Sender:', sender)
    console.log('📦 Data:', data)
    console.log('📦 Data length:', data.length)
    
    const callData = Buffer.from(data.slice(2), 'hex')
    
    // CCIP-Read data structure: node(32) + selector(4) + parameters
    if (callData.length < 36) {
      return NextResponse.json({ 
        error: 'Invalid data length - need at least 36 bytes' 
      }, { status: 400, headers: corsHeaders })
    }
    
    // Extract components
    const node = '0x' + callData.slice(0, 32).toString('hex')
    const selector = '0x' + callData.slice(32, 36).toString('hex')
    const parametersData = callData.slice(36)
    
    console.log('🔗 Extracted node:', node)
    console.log('🎯 Function selector:', selector)
    console.log('📦 Parameters length:', parametersData.length)

    let result: string

    if (selector === '0x3b3b57de') {
      // addr(bytes32) - Address resolution
      console.log('📍 Processing address resolution...')
      
      try {
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
        
      } catch (usernameError) {
        if (usernameError instanceof Error && usernameError.message.includes('DOMAIN_NOT_FOUND')) {
          console.log('📍 Domain not found, returning zero address')
          // Return zero address for unknown domains (standard ENS behavior)
          result = '0x' + '0'.repeat(64) // 32 bytes of zeros
        } else {
          throw usernameError // Re-throw other errors
        }
      }
      
    } else if (selector === '0x59d1d43c') {
      // text(bytes32,string) - Text record resolution
      console.log('📝 Processing text record resolution...')
      
      // Debug the exact parameter structure
      const parametersHex = ('0x' + parametersData.toString('hex')) as `0x${string}`
      console.log('📝 Parameters hex:', parametersHex)
      console.log('📝 Parameters length:', parametersData.length)
      
      // Try to manually parse the string from the end of the data
      // Look for the string "name" or "bio" in the hex
      const hexString = parametersData.toString('hex')
      console.log('📝 Raw hex:', hexString)
      
      // Convert hex chunks to see what's in there
      for (let i = 0; i < hexString.length; i += 64) {
        const chunk = hexString.slice(i, i + 64)
        console.log(`📝 Chunk ${i/64}:`, chunk)
        
        // Try to decode as string
        try {
          const bytes = Buffer.from(chunk, 'hex')
          const asString = bytes.toString('utf8').replace(/\0/g, '')
          if (asString.length > 0 && /^[a-zA-Z0-9]+$/.test(asString)) {
            console.log(`📝   As string: "${asString}"`)
          }
        } catch (e) {
          console.log(e);
        }
      }
      
      // For now, extract key manually from the hex
      let key = ''
      
      // Look for common keys in hex: "name" = 6e616d65, "bio" = 62696f
      if (hexString.includes('6e616d65')) {
        key = 'name'
        console.log('📝 Found "name" in hex data')
      } else if (hexString.includes('62696f')) {
        key = 'bio'
        console.log('📝 Found "bio" in hex data')
      } else {
        console.log('📝 Could not find known key in hex data')
        key = 'unknown'
      }
      
      console.log('🔑 Extracted key:', `"${key}"`)
      
      try {
        const username = await findUsernameFromNode(node)
        console.log('👤 Resolved username:', username)
        
        console.log('📝 Calling getText on contract...')
        let textValue = await basePublicClient.readContract({
          address: CONTX_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'getText',
          args: [username, key],
        }) as string
        
        console.log('📄 Contract returned text:', `"${textValue}"`)
        console.log('📄 Text length:', textValue.length)
        
        // If empty, also try profileData mapping directly
        if (!textValue || textValue.length === 0) {
          console.log('📝 getText returned empty, trying profileData directly...')
          try {
            const directValue = await basePublicClient.readContract({
              address: CONTX_REGISTRY_ADDRESS,
              abi: [
                {
                  inputs: [
                    { name: 'username', type: 'string' },
                    { name: 'key', type: 'string' }
                  ],
                  name: 'profileData',
                  outputs: [{ name: '', type: 'string' }],
                  stateMutability: 'view',
                  type: 'function',
                }
              ],
              functionName: 'profileData',
              args: [username, key],
            }) as string
            
            console.log('📄 Direct profileData returned:', `"${directValue}"`)
            if (directValue && directValue.length > 0) {
              console.log('📝 Using direct profileData result')
              textValue = directValue
            }
          } catch (directError) {
            console.log('📝 Direct profileData call failed:', directError)
          }
        }

        // Convert to JSON for AI fields if needed
        let processedValue = textValue || '' // Ensure we have a string
        if (key.startsWith('ai.') && processedValue && !processedValue.startsWith('[') && !processedValue.startsWith('{')) {
          const items = processedValue.split(',').map(item => item.trim())
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
        
      } catch (usernameError) {
        if (usernameError instanceof Error && usernameError.message.includes('DOMAIN_NOT_FOUND')) {
          console.log('📝 Domain not found, returning empty string')
          // Return empty string for unknown domains (standard ENS behavior)
          const emptyStringEncoded = Buffer.concat([
            Buffer.from('0000000000000000000000000000000000000000000000000000000000000020', 'hex'), // offset
            Buffer.alloc(32), // length = 0
          ])
          result = '0x' + emptyStringEncoded.toString('hex')
        } else {
          throw usernameError // Re-throw other errors
        }
      }
      
    } else {
      console.log('❌ Unsupported function selector:', selector)
      return NextResponse.json({ 
        error: `Function not supported: ${selector}` 
      }, { status: 404, headers: corsHeaders })
    }

    console.log('✅ CCIP-Read completed successfully!')
    return NextResponse.json({ data: result }, {
      headers: corsHeaders
    })

  } catch (error) {
    console.error('❌ CCIP-Read error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({
      error: 'Resolution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: corsHeaders
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}