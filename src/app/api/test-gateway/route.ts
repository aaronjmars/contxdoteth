// src/app/api/test-gateway/route.ts - Updated for Production
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://contx.name'
    : 'http://localhost:3000'

  try {
    // Test 1: Registry health check
    const registryTest = await fetch(`${baseUrl}/api/ccip-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alice',
        method: 'getProfile'
      })
    })

    const registryResult = await registryTest.json()

    // Test 2: Address resolution
    const addressTest = await fetch(`${baseUrl}/api/ccip-read`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alice',
        method: 'getAddress'
      })
    })

    const addressResult = await addressTest.json()

    // Test 3: Text record
    const textTest = await fetch(`${baseUrl}/api/ccip-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alice',
        method: 'getText',
        key: 'ai.topics'
      })
    })

    const textResult = await textTest.json()

    // Test 4: Username availability
    const availabilityTest = await fetch(`${baseUrl}/api/ccip-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'available123',
        method: 'isAvailable'
      })
    })

    const availabilityResult = await availabilityTest.json()

    return NextResponse.json({
      gateway: 'Production CCIP-Read Gateway Test',
      registry: '0xa2bbe9b6a4ca01806b1cfac4174e4976ce2b0d70',
      resolver: '0x20cb27a5f5c77968650aaaa66e11ba9334689068',
      network: 'Base Mainnet',
      gatewayUrl: `${baseUrl}/api/ccip-read/{sender}/{data}`,
      tests: {
        getProfile: registryResult,
        getAddress: addressResult, 
        getText: textResult,
        isAvailable: availabilityResult
      },
      status: 'ready',
      instructions: [
        '1. Register test users: register("alice", "Alice Smith", "Web3 developer")',
        '2. Add AI context: updateField("alice", "ai.topics", \'["web3", "ai"]\')',
        '3. Connect contx.eth to resolver via ENS Manager App',
        '4. Test ENS resolution: provider.resolveName("alice.contx.eth")'
      ],
      ensTesting: {
        domain: 'contx.eth',
        testSubdomains: ['alice.contx.eth', 'bob.contx.eth'],
        ensManager: 'https://app.ens.domains',
        namehashTool: 'https://swolfeyes.github.io/ens-namehash-calculator/'
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Gateway test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      registry: '0xa2bbe9b6a4ca01806b1cfac4174e4976ce2b0d70',
      resolver: '0x20cb27a5f5c77968650aaaa66e11ba9334689068',
      network: 'Base Mainnet',
      gatewayUrl: `${baseUrl}/api/ccip-read/{sender}/{data}`
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json()
    
    if (test === 'namehash') {
      // Helper to calculate namehash for testing
      const { keccak256, encodePacked } = await import('viem')
      
      function calculateNamehash(name: string): string {
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
      
      const testNames = [
        'contx.eth',
        'alice.contx.eth', 
        'bob.contx.eth',
        'test.contx.eth'
      ]
      
      const namehashes = testNames.map(name => ({
        name,
        namehash: calculateNamehash(name)
      }))
      
      return NextResponse.json({
        namehashes,
        note: 'Use these namehash values for testing ENS resolution'
      })
    }
    
    return NextResponse.json({
      message: 'Use this endpoint to test gateway functionality',
      availableTests: {
        'namehash': 'Calculate namehash for test domains'
      },
      example: {
        method: 'POST',
        body: { test: 'namehash' }
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}