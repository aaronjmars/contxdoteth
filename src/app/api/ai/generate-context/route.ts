import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const TWITTER_API_KEY = process.env.TWITTER_API_KEY

interface TwitterProfile {
  name: string
  description: string
  followers: number
  following: number
  statusesCount: number
  createdAt: string
  profilePicture?: string
  isVerified?: boolean
  isBlueVerified?: boolean
  location?: string
  userName: string
  profile_bio?: {
    description: string
  }
}

interface Tweet {
  text: string
  createdAt: string
  author: TwitterProfile
  publicMetrics?: {
    retweetCount: number
    likeCount: number
    replyCount: number
  }
}

interface AIContextResponse {
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

// Helper function to fetch tweets with pagination
async function fetchAllTweets(userName: string, maxTweets = 50): Promise<Tweet[]> {
  console.log(`📡 fetchAllTweets: Starting for @${userName}, max: ${maxTweets}`)
  
  let allTweets: Tweet[] = []
  let cursor = ''
  let hasNextPage = true
  let pageCount = 0
  
  while (hasNextPage && allTweets.length < maxTweets) {
    pageCount++
    console.log(`📄 Fetching page ${pageCount}...`)
    
    try {
      const url = new URL('https://api.twitterapi.io/twitter/user/last_tweets')
      url.searchParams.append('userName', userName)
      url.searchParams.append('includeReplies', 'false')
      if (cursor) {
        url.searchParams.append('cursor', cursor)
        console.log(`🔄 Using cursor: ${cursor.substring(0, 20)}...`)
      }

      console.log(`🌐 Calling Twitter API: ${url.toString()}`)

      const options = {
        method: 'GET',
        headers: {
          'X-API-Key': TWITTER_API_KEY!
        }
      }

      const response = await fetch(url.toString(), options)
      console.log(`📡 Twitter API Response: ${response.status} ${response.statusText}`)
      
      const data = await response.json()
      console.log(`📋 Response data keys: ${Object.keys(data).join(', ')}`)
      
      // Debug: Log the actual response structure
      console.log('🔍 Full response structure:', JSON.stringify(data, null, 2))

      if (data.status !== 'success') {
        console.error(`❌ Twitter API error: ${data.msg || data.message || 'Unknown error'}`)
        console.error('Full response:', JSON.stringify(data, null, 2))
        throw new Error(`Twitter API error: ${data.msg || data.message || 'Unknown error'}`)
      }

      // The API returns tweets in data.data.tweets array
      const tweets = data.data?.tweets || []
      
      // Add tweets to collection (filter out replies)
      if (tweets && tweets.length > 0) {
        const nonReplyTweets = tweets.filter((tweet: Tweet & { isReply?: boolean }) => !tweet.isReply)
        console.log(`📝 Found ${tweets.length} tweets (${nonReplyTweets.length} non-replies) in this page`)
        allTweets.push(...nonReplyTweets)
        
        // Sort by creation date (newest first)
        allTweets.sort((a: Tweet, b: Tweet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        // Trim to max tweets if exceeded
        if (allTweets.length > maxTweets) {
          allTweets = allTweets.slice(0, maxTweets)
          console.log(`✂️ Trimmed to ${maxTweets} tweets`)
          break
        }
      } else {
        console.log(`📭 No tweets found in this page`)
      }

      // Check for next page
      hasNextPage = data.has_next_page
      cursor = data.next_cursor || ''
      
      console.log(`📊 Total tweets so far: ${allTweets.length}`)
      console.log(`🔄 Has next page: ${hasNextPage}`)

      // Add delay to respect rate limits
      console.log('⏳ Waiting 100ms for rate limiting...')
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error('💥 Error fetching tweets:', error)
      throw error
    }
  }

  console.log(`✅ fetchAllTweets completed: ${allTweets.length} tweets total`)
  return allTweets
}

// Helper function to analyze tweets with GPT-4o
async function analyzeTwitterProfile(tweets: Tweet[], userProfile: TwitterProfile): Promise<AIContextResponse> {
  console.log(`🤖 analyzeTwitterProfile: Starting analysis...`)
  console.log(`📊 Input: ${tweets.length} tweets, user: ${userProfile.name}`)
  
  const tweetTexts = tweets.map(tweet => tweet.text).join('\n\n')
  console.log(`📝 Total tweet text length: ${tweetTexts.length} characters`)
  
  const prompt = `
Analyze this Twitter profile and tweets to generate content for ENS profile fields:

USER PROFILE:
- Name: ${userProfile.name}
- Bio: ${userProfile.profile_bio?.description || userProfile.description || 'No bio available'}
- Followers: ${userProfile.followers}
- Following: ${userProfile.following}
- Location: ${userProfile.location || 'Not specified'}

RECENT TWEETS (${tweets.length} tweets):
${tweetTexts}

Generate a JSON response that fills these specific ENS profile fields:
{
  "name": "Display name for the profile",
  "bio": "Concise bio paragraph (50-100 words)",
  "lore": "Backstory or origin story (30-50 words)",
  "messageExamples": "JSON array of 3-5 example messages they might send",
  "postExamples": "JSON array of 3-5 example posts/tweets they might make",
  "adjectives": "JSON array of 5-8 descriptive adjectives",
  "topics": "JSON array of main topics/interests (5-8 items)",
  "style": "JSON object describing communication style",
  "knowledge": "JSON array of areas of expertise/knowledge",
  "avatar": "URL to profile picture if available, or empty string",
  "description": "One-line tagline or description"
}

Guidelines:
- name: Use their actual name or handle
- bio: Engaging paragraph about who they are and what they do
- lore: Brief origin story or how they got into their field
- messageExamples: Realistic DMs/messages they might send (conversational)
- postExamples: Realistic tweets/posts in their voice
- adjectives: Personality traits evident from their content
- topics: Main interests (prefer: web3, ai, development, base, ens, crypto, design, community)
- style: Communication patterns and tone
- knowledge: Areas of expertise
- avatar: Their profile picture URL or empty string
- description: Catchy one-liner

Focus on Web3, crypto, AI, and technology themes when relevant.
Make content engaging and authentic to their voice.
Respond with valid JSON only.
`

  try {
    console.log(`🧠 Calling OpenAI GPT-4o...`)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing social media profiles to extract personality traits, interests, and communication styles for Web3/crypto/AI communities. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    console.log(`✅ OpenAI response received`)
    console.log(`📊 Usage: ${completion.usage?.total_tokens} tokens`)
    
    const responseContent = completion.choices[0].message.content || '{}'
    console.log(`📋 Raw AI response: ${responseContent.substring(0, 200)}...`)

    const analysis = JSON.parse(responseContent)
    console.log(`✅ JSON parsed successfully`)
    console.log(`📊 Generated ENS fields:`)
    console.log(`   Name: ${analysis.name || 'N/A'}`)
    console.log(`   Bio: ${analysis.bio?.substring(0, 50) || 'N/A'}...`)
    console.log(`   Topics: ${typeof analysis.topics === 'string' ? analysis.topics : JSON.stringify(analysis.topics)}`)
    
    // Validate and ensure required fields with fallbacks
    const result: AIContextResponse = {
      name: analysis.name || userProfile.name || userProfile.userName,
      bio: analysis.bio || userProfile.profile_bio?.description || userProfile.description || `${userProfile.name} on X`,
      lore: analysis.lore || 'Building and creating in the digital space.',
      messageExamples: typeof analysis.messageExamples === 'string' ? analysis.messageExamples : JSON.stringify(analysis.messageExamples || ['Hey! How are you?', 'Thanks for connecting!', 'Let me know if you need anything']),
      postExamples: typeof analysis.postExamples === 'string' ? analysis.postExamples : JSON.stringify(analysis.postExamples || ['Just shipped something cool!', 'Working on exciting projects', 'Love connecting with the community']),
      adjectives: typeof analysis.adjectives === 'string' ? analysis.adjectives : JSON.stringify(analysis.adjectives || ['creative', 'thoughtful', 'engaged', 'innovative']),
      topics: typeof analysis.topics === 'string' ? analysis.topics : JSON.stringify(analysis.topics || ['technology', 'community', 'innovation']),
      style: typeof analysis.style === 'string' ? analysis.style : JSON.stringify(analysis.style || { tone: 'friendly', approach: 'collaborative' }),
      knowledge: typeof analysis.knowledge === 'string' ? analysis.knowledge : JSON.stringify(analysis.knowledge || ['technology', 'digital media', 'community building']),
      avatar: analysis.avatar || userProfile.profilePicture || '',
      description: analysis.description || `${userProfile.name} on X`
    }
    
    console.log(`✅ analyzeTwitterProfile completed successfully`)
    return result
    
  } catch (error) {
    console.error('💥 Error analyzing with GPT-4o:', error)
    console.log(`🔄 Falling back to keyword-based analysis...`)
    
    // Fallback analysis if OpenAI fails
    return generateFallbackAnalysis(tweets, userProfile)
  }
}

// Fallback analysis if OpenAI is unavailable
function generateFallbackAnalysis(tweets: Tweet[], userProfile: TwitterProfile): AIContextResponse {
  const tweetTexts = tweets.map(t => t.text.toLowerCase()).join(' ')
  
  // Extract topics based on keywords
  const topicKeywords: { [key: string]: string[] } = {
    'web3': ['web3', 'crypto', 'blockchain', 'defi', 'nft', 'dao'],
    'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt'],
    'development': ['code', 'coding', 'programming', 'developer', 'build'],
    'base': ['base', 'base chain', 'coinbase'],
    'ens': ['ens', 'ethereum name service', '.eth']
  }
  
  const detectedTopics: string[] = []
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => tweetTexts.includes(keyword))) {
      detectedTopics.push(topic)
    }
  }
  
  // Generate fallback content
  const bio = userProfile.profile_bio?.description || userProfile.description || `${userProfile.name} on X`
  const location = userProfile.location ? ` Based in ${userProfile.location}.` : ''
  const followers = userProfile.followers > 1000 ? ` ${userProfile.followers.toLocaleString()} followers.` : ''
  
  return {
    name: userProfile.name || userProfile.userName,
    bio: bio + location + followers,
    lore: 'Active contributor to the digital community, sharing insights and connecting with others.',
    messageExamples: JSON.stringify(['Hey! How are you?', 'Thanks for connecting!', 'Let me know if you need anything', 'Hope you\'re doing well!']),
    postExamples: JSON.stringify(['Just discovered something interesting!', 'Working on exciting projects', 'Love connecting with the community', 'Always learning new things']),
    adjectives: JSON.stringify(['engaged', 'thoughtful', 'creative', 'collaborative', 'innovative']),
    topics: JSON.stringify(detectedTopics.length > 0 ? detectedTopics : ['technology', 'community', 'innovation']),
    style: JSON.stringify({ tone: 'friendly', approach: 'collaborative' }),
    knowledge: JSON.stringify(['digital media', 'community building', 'online communication']),
    avatar: userProfile.profilePicture || '',
    description: `${userProfile.name} on X`
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/ai/generate-context - Starting...')
  
  try {
    console.log('📝 Parsing request body...')
    const { username, twitterUsername } = await request.json()
    console.log(`📋 Request data: username="${username}", twitterUsername="${twitterUsername}"`)

    // Check environment variables
    console.log('🔧 Checking environment variables...')
    console.log(`TWITTER_API_KEY: ${TWITTER_API_KEY ? '✅ Set' : '❌ Missing'}`)
    console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`)

    if (!TWITTER_API_KEY) {
      console.error('❌ TWITTER_API_KEY environment variable is missing')
      return NextResponse.json({ 
        error: 'Twitter API key is not configured' 
      }, { status: 500 })
    }

    if (!twitterUsername) {
      console.error('❌ Twitter username is required')
      return NextResponse.json({ 
        error: 'Twitter username is required for AI context generation' 
      }, { status: 400 })
    }

    console.log(`🐦 Generating AI context for @${twitterUsername}...`)
    
    // Fetch tweets from Twitter API
    console.log('📱 Fetching tweets from Twitter API...')
    const tweets = await fetchAllTweets(twitterUsername, 50)
    console.log(`📊 Fetched ${tweets.length} tweets`)
    
    if (tweets.length === 0) {
      console.error(`❌ No tweets found for @${twitterUsername}`)
      return NextResponse.json({ 
        error: 'No tweets found for this user. Please ensure the username is correct and the account is public.' 
      }, { status: 404 })
    }

    // Get user profile from first tweet's author data
    const userProfile = tweets[0].author
    console.log(`👤 User profile: ${userProfile.name} (@${twitterUsername})`)
    console.log(`📈 Profile stats: ${userProfile.followers} followers, ${userProfile.following} following`)
    
    console.log(`🤖 Analyzing ${tweets.length} tweets with AI...`)
    
    // Analyze with GPT-4o (or fallback)
    const analysis = await analyzeTwitterProfile(tweets, userProfile)
    console.log(`✅ AI analysis complete:`)
    console.log(`   Name: ${analysis.name}`)
    console.log(`   Bio: ${analysis.bio?.substring(0, 50)}...`)
    console.log(`   Lore: ${analysis.lore?.substring(0, 30)}...`)
    console.log(`   Topics: ${analysis.topics}`)
    
    // Generate complete AI context using contract field names
    const aiContext = analysis

    // Generate ENS text records that match the contract's getFieldNames() response
    const ensRecords = {
      // Contract's hardcoded fields populated with AI-generated content
      'name': analysis.name,
      'bio': analysis.bio,
      'lore': analysis.lore,
      'messageExamples': analysis.messageExamples,
      'postExamples': analysis.postExamples,
      'adjectives': analysis.adjectives,
      'topics': analysis.topics,
      'style': analysis.style,
      'knowledge': analysis.knowledge,
      'avatar': analysis.avatar,
      'description': analysis.description
    }

    console.log(`📦 Generated ${Object.keys(ensRecords).length} ENS records`)
    console.log('✅ AI context generation completed successfully')

    return NextResponse.json({
      success: true,
      username,
      twitterUsername,
      tweetsAnalyzed: tweets.length,
      aiContext,
      ensRecords,
      metadata: {
        userProfile: {
          name: userProfile.name,
          followers: userProfile.followers,
          following: userProfile.following,
          statusesCount: userProfile.statusesCount,
          createdAt: userProfile.createdAt,
          verified: userProfile.isVerified,
          location: userProfile.location
        },
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('💥 AI context generation error:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI context'
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false
    }, { status: 500 })
  }
}