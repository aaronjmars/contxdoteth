import { NextRequest, NextResponse } from 'next/server'

interface XDataRequest {
  username: string
  walletAddress: string
  aiContext: {
    name: string
    bio: string
    lore: string
    messageExamples: string
    postExamples: string
    adjectives: string
    topics: string
    style: string
    knowledge: string
    avatar: string
    description: string
  }
  twitterUsername?: string
}

interface XDataResponse {
  success: boolean
  username: string
  walletAddress: string
  ensRecords: Record<string, string>
  registrationData: {
    name: string
    owner: string
    duration: number
    resolver: string
    data: string[]
  }
  metadata: {
    twitterUsername?: string
    aiContextGenerated: boolean
    recordCount: number
    processedAt: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<XDataResponse | { error: string }>> {
  try {
    const { username, walletAddress, aiContext, twitterUsername }: XDataRequest = await request.json()

    // Validate required fields
    if (!username || !walletAddress || !aiContext) {
      return NextResponse.json({ 
        error: 'Missing required fields: username, walletAddress, and aiContext are required' 
      }, { status: 400 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ 
        error: 'Invalid wallet address format' 
      }, { status: 400 })
    }

    // Validate username format (alphanumeric, 3-63 characters)
    if (!/^[a-z0-9]{3,63}$/.test(username)) {
      return NextResponse.json({ 
        error: 'Invalid username format. Must be 3-63 characters, alphanumeric only' 
      }, { status: 400 })
    }

    console.log(`Processing x-data for ${username}.contx.eth...`)

    // Generate ENS text records from AI context using contract field names
    const ensRecords: Record<string, string> = {
      // Contract's hardcoded fields populated with AI-generated content
      'name': aiContext.name,
      'bio': aiContext.bio,
      'lore': aiContext.lore,
      'messageExamples': aiContext.messageExamples,
      'postExamples': aiContext.postExamples,
      'adjectives': aiContext.adjectives,
      'topics': aiContext.topics,
      'style': aiContext.style,
      'knowledge': aiContext.knowledge,
      'avatar': aiContext.avatar,
      'description': aiContext.description,
      
      // Additional metadata
      'x.twitter': twitterUsername || '',
      'x.processed': new Date().toISOString(),
      'x.version': '1.0'
    }

    // Prepare registration data for ENS contract
    // This would be used by the smart contract to set up the ENS name
    const registrationData = {
      name: `${username}.contx.eth`,
      owner: walletAddress,
      duration: 31536000, // 1 year in seconds
      resolver: process.env.NEXT_PUBLIC_ETH_RESOLVER_ADDRESS || '',
      data: Object.entries(ensRecords).map(([key, value]) => `${key}:${value}`)
    }

    // Here you could add additional processing:
    // - Validate against existing registrations
    // - Check for prohibited usernames
    // - Generate additional metadata
    // - Prepare smart contract call data

    console.log(`Generated ${Object.keys(ensRecords).length} ENS records for ${username}.contx.eth`)

    const response: XDataResponse = {
      success: true,
      username,
      walletAddress,
      ensRecords,
      registrationData,
      metadata: {
        twitterUsername,
        aiContextGenerated: true,
        recordCount: Object.keys(ensRecords).length,
        processedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('X-Data processing error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process x-data'
    
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
}

// Health check for the x-data endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: '/api/x-data',
    description: 'ENS registration data processing endpoint',
    timestamp: new Date().toISOString()
  })
}