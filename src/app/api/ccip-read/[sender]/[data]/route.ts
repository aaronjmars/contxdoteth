import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, Address, keccak256, encodePacked, decodeAbiParameters, fallback } from 'viem'
import { base } from 'viem/chains'

const REGISTRY_ADDRESS = '0xa2bbe9b6a4ca01806b1cfac4174e4976ce2b0d70' as Address

const basePublicClient = createPublicClient({
  chain: base,
  transport: fallback([
    http('https://base.llamarpc.com'),
    http('https://mainnet.base.org'),
    http('https://base-mainnet.g.alchemy.com/v2/demo'),
    http('https://base.gateway.tenderly.co'),
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


// Query contract events to find all registered usernames
async function extractUsernameFromNode(node: string): Promise<string> {
  console.log('🔍 Searching for username with node:', node)
  
  try {
    // First, try common patterns for quick resolution
    const commonPatterns = [
      'aaron', 'alice', 'bob', 'test', 'demo', 'admin', 'user', 'dev', 'example'
    ]
    
    console.log('🔍 Trying common username patterns first...')
    for (const username of commonPatterns) {
      const calculatedNode = namehash(`${username}.contx.eth`)
      if (calculatedNode.toLowerCase() === node.toLowerCase()) {
        console.log('✅ Found username via common pattern:', username)
        
        // Verify this username actually exists in the registry
        try {
          const profile = await basePublicClient.readContract({
            address: REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            functionName: 'getProfile',
            args: [username],
          }) as [Address, string, boolean]
          
          if (profile[2]) { // exists
            return username
          }
        } catch {
          console.log(`Username ${username} matches node but not found in registry`)
          continue
        }
      }
    }

    // Try to get events for more comprehensive search
    try {
      console.log('🔍 Fetching registration events...')
      const eventSignature = 'SubdomainRegistered(string,address)'
      const eventTopic = keccak256(new TextEncoder().encode(eventSignature))
      
      const events = await basePublicClient.getLogs({
        address: REGISTRY_ADDRESS,
        fromBlock: 'earliest',
        toBlock: 'latest'
      })
      
      console.log(`📋 Found ${events.length} total events`)
      
      // Filter for SubdomainRegistered events
      const registrationEvents = events.filter(event => 
        event.topics && event.topics[0] === eventTopic
      )
      
      console.log(`📋 Found ${registrationEvents.length} registration events`)
      
      // Extract usernames from events and check each one
      for (const event of registrationEvents) {
      if (event.transactionHash) {
        try {
          // Get the transaction receipt to get the decoded event data
          const receipt = await basePublicClient.getTransactionReceipt({
            hash: event.transactionHash
          })
          
          // Find the SubdomainRegistered event in the receipt
          for (const log of receipt.logs) {
            if (log.address.toLowerCase() === REGISTRY_ADDRESS.toLowerCase() && 
                log.topics && log.topics[0] === eventTopic) {
              
              // Decode the non-indexed data (the actual username string)
              if (log.data && log.data !== '0x') {
                try {
                  // The data contains the non-indexed parameters
                  // Since username is indexed, we need to decode from the transaction input instead
                  const transaction = await basePublicClient.getTransaction({
                    hash: event.transactionHash
                  })
                  
                  if (transaction.input && transaction.input.length > 10) {
                    // Decode the register function call
                    const callData = transaction.input.slice(10) // Remove function selector
                    
                    // Try to decode the parameters - register(string username, string name, string bio)
                    try {
                      const decoded = decodeAbiParameters(
                        [
                          { name: 'username', type: 'string' },
                          { name: 'name', type: 'string' },
                          { name: 'bio', type: 'string' }
                        ],
                        `0x${callData}`
                      )
                      
                      const username = decoded[0]
                      if (username) {
                        const calculatedNode = namehash(`${username}.contx.eth`)
                        if (calculatedNode.toLowerCase() === node.toLowerCase()) {
                          console.log('✅ Found username from event transaction:', username)
                          return username
                        }
                      }
                    } catch (decodeError) {
                      console.log('Failed to decode transaction parameters:', decodeError)
                    }
                  }
                } catch (dataError) {
                  console.log('Error decoding event data:', dataError)
                }
              }
            }
          }
        } catch (eventError) {
          console.log('Error processing event:', eventError)
        }
      }
    }
    
    } catch (eventFetchError) {
      console.log('⚠️ Failed to fetch events, falling back to pattern matching:', eventFetchError)
    }
    
    console.log('🔄 Falling back to comprehensive pattern matching...')
    
    // Fallback to comprehensive pattern matching
    const patterns = [
      // Common names
      'aaron', 'alice', 'bob', 'test', 'demo', 'charlie', 'diana', 'john', 'jane',
      'admin', 'user', 'dev', 'example', 'test1', 'test2', 'test3',
      // Single characters
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      // Two character combinations (most common)
      'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au', 'av', 'aw', 'ax', 'ay', 'az',
      'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'bj', 'bk', 'bl', 'bm', 'bn', 'bo', 'bp', 'bq', 'br', 'bs', 'bt', 'bu', 'bv', 'bw', 'bx', 'by', 'bz',
      // Common web3 terms
      'crypto', 'web3', 'eth', 'base', 'defi', 'nft', 'dao', 'gm', 'hello', 'world'
    ]
    
    console.log(`🔍 Checking ${patterns.length} username patterns...`)
    
    for (const username of patterns) {
      const calculatedNode = namehash(`${username}.contx.eth`)
      if (calculatedNode.toLowerCase() === node.toLowerCase()) {
        console.log('✅ Found username via pattern:', username)
        
        // Verify this username actually exists in the registry
        try {
          const profile = await basePublicClient.readContract({
            address: REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            functionName: 'getProfile',
            args: [username],
          }) as [Address, string, boolean]
          
          if (profile[2]) { // exists
            return username
          }
        } catch {
          console.log(`Username ${username} matches node but not found in registry`)
          continue
        }
      }
    }
    
    throw new Error(`Username not found for node: ${node}. The username might not be in our search patterns.`)
    
  } catch (err) {
    console.error('Error in username extraction:', err)
    throw new Error(`Failed to extract username for node: ${node}`)
  }
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
      console.log('🔍 Decoding text function call data')
      console.log('Data length:', decodedBytes.length)
      console.log('Data hex:', decodedBytes.toString('hex'))
      
      // Use viem's built-in ABI decoding for the text function parameters
      // The full call data is text(bytes32 node, string key)
      // We need to decode the string parameter
      
      let key: string
      try {
        // Decode the function call parameters
        const callData = '0x' + decodedBytes.toString('hex')
        console.log('Full call data:', callData)
        
        // Extract just the parameters part (after the function selector)
        const parametersData = ('0x' + decodedBytes.slice(4).toString('hex')) as `0x${string}`
        console.log('Parameters data:', parametersData)
        
        // Decode the parameters: (bytes32 node, string key)
        const decoded = decodeAbiParameters(
          [
            { name: 'node', type: 'bytes32' },
            { name: 'key', type: 'string' }
          ],
          parametersData
        )
        
        key = decoded[1] as string
        console.log('✅ Decoded key via ABI:', `"${key}"`)
        
      } catch (decodeError) {
        console.error('❌ Failed to decode text function parameters:', decodeError)
        throw new Error('Failed to decode text function call data')
      }
      
      console.log('📝 Resolving text for key:', key)
      console.log('👤 Username:', username)
      
      const textValue = await basePublicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'getText',
        args: [username, key],
      }) as string
      
      console.log('📄 Retrieved text value:', textValue)
      console.log('📏 Text value length:', textValue.length)

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