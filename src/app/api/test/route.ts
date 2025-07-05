// src/app/api/test/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const baseUrl = `https://${host}`
  
  try {
    // Test alice profile
    const response = await fetch(`${baseUrl}/api/ccip-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alice',
        method: 'getProfile'
      })
    })

    const result = await response.json()

    return NextResponse.json({
      status: 'API Working!',
      baseUrl,
      registry: '0xa2bbe9b6a4ca01806b1cfac4174e4976ce2b0d70',
      resolver: '0x20cb27a5f5c77968650aaaa66e11ba9334689068',
      test: {
        aliceProfile: result
      },
      instructions: result.success ? [
        '✅ Alice found! Ready for ENS connection',
        '1. Connect contx.eth to resolver via ENS Manager',
        '2. Test: provider.resolveName("alice.contx.eth")'
      ] : [
        '❌ Alice not found',
        '1. Register: register("alice", "Alice Smith", "Web3 dev")',
        '2. Add: updateField("alice", "description", "Building on Base")',
        '3. Add: updateField("alice", "ai.topics", "web3,ai,base")'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}