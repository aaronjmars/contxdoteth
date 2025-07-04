import { NextRequest, NextResponse } from 'next/server'

interface TwitterProfile {
  username: string
  name: string
  bio: string
  followers_count: number
  following_count: number
  verified: boolean
  location?: string
  website?: string
}

interface Tweet {
  id: string
  text: string
  created_at: string
  public_metrics: {
    retweet_count: number
    like_count: number
    reply_count: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, tweets } = await request.json() as { profile: TwitterProfile, tweets: Tweet[] }

    if (!profile || !tweets) {
      return NextResponse.json({ error: 'Missing profile or tweets data' }, { status: 400 })
    }

    // Generate AI context based on profile and tweets
    const aiContext = generateAIContext(profile, tweets)

    return NextResponse.json({
      aiContext,
      success: true
    })

  } catch (error) {
    console.error('AI context generation error:', error)
    return NextResponse.json({ error: 'Failed to generate AI context' }, { status: 500 })
  }
}

function generateAIContext(profile: TwitterProfile, tweets: Tweet[]) {
  // Extract topics from tweets
  const topics = extractTopics(tweets)
  
  // Analyze communication style
  const style = analyzeStyle(tweets)
  
  // Extract personality traits
  const traits = extractTraits(profile, tweets)
  
  // Create bio lines
  const bioLines = createBioLines(profile, tweets)

  return {
    'ai.bio': bioLines,
    'ai.style': style,
    'ai.topics': topics,
    'ai.traits': traits,
    'ai.updated': new Date().toISOString(),
    'ai.version': '1.0'
  }
}

function extractTopics(tweets: Tweet[]): string[] {
  const topicKeywords: { [key: string]: string[] } = {
    'web3': ['web3', 'crypto', 'blockchain', 'defi', 'nft', 'dao'],
    'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'claude'],
    'development': ['code', 'coding', 'programming', 'developer', 'build', 'ship'],
    'entrepreneurship': ['startup', 'founder', 'business', 'launch', 'product'],
    'technology': ['tech', 'innovation', 'software', 'app', 'platform'],
    'community': ['community', 'team', 'collaboration', 'open source'],
    'design': ['design', 'ui', 'ux', 'interface', 'user experience'],
    'base': ['base', 'base chain', 'base l2', 'coinbase'],
    'ens': ['ens', 'ethereum name service', 'domain', '.eth']
  }

  const tweetText = tweets.map(t => t.text.toLowerCase()).join(' ')
  const foundTopics: string[] = []

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => tweetText.includes(keyword))) {
      foundTopics.push(topic)
    }
  }

  return foundTopics.slice(0, 6) // Limit to 6 topics
}

function analyzeStyle(tweets: Tweet[]): { [key: string]: string[] } {
  const styles: string[] = []
  
  const avgTweetLength = tweets.reduce((sum, tweet) => sum + tweet.text.length, 0) / tweets.length
  
  if (avgTweetLength < 100) {
    styles.push('concise')
  } else if (avgTweetLength > 200) {
    styles.push('detailed')
  }
  
  const hasEmojis = tweets.some(tweet => /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(tweet.text))
  if (hasEmojis) {
    styles.push('expressive')
  }
  
  const hasHashtags = tweets.some(tweet => tweet.text.includes('#'))
  if (hasHashtags) {
    styles.push('community-focused')
  }
  
  const hasQuestions = tweets.some(tweet => tweet.text.includes('?'))
  if (hasQuestions) {
    styles.push('inquisitive')
  }
  
  const hasTechnicalTerms = tweets.some(tweet => 
    /\b(API|SDK|JSON|HTTP|REST|GraphQL|smart contract|blockchain|algorithm)\b/i.test(tweet.text)
  )
  if (hasTechnicalTerms) {
    styles.push('technical')
  }

  return {
    'all': styles.slice(0, 4), // Limit to 4 styles
    'chat': ['friendly', 'helpful']
  }
}

function extractTraits(profile: TwitterProfile, tweets: Tweet[]): string[] {
  const traits: string[] = []
  
  // Based on bio
  if (profile.bio.toLowerCase().includes('build')) {
    traits.push('builder')
  }
  if (profile.bio.toLowerCase().includes('learn')) {
    traits.push('curious')
  }
  if (profile.bio.toLowerCase().includes('help')) {
    traits.push('helpful')
  }
  
  // Based on tweet patterns
  const positiveWords = ['excited', 'amazing', 'great', 'awesome', 'love', 'fantastic']
  const hasPositiveLanguage = tweets.some(tweet => 
    positiveWords.some(word => tweet.text.toLowerCase().includes(word))
  )
  if (hasPositiveLanguage) {
    traits.push('optimistic')
  }
  
  const hasSharing = tweets.some(tweet => 
    tweet.text.toLowerCase().includes('share') || 
    tweet.text.toLowerCase().includes('learn') ||
    tweet.text.toLowerCase().includes('thanks')
  )
  if (hasSharing) {
    traits.push('collaborative')
  }
  
  // High engagement suggests being influential
  const avgLikes = tweets.reduce((sum, tweet) => sum + tweet.public_metrics.like_count, 0) / tweets.length
  if (avgLikes > 30) {
    traits.push('influential')
  }
  
  // Default traits
  if (traits.length === 0) {
    traits.push('thoughtful', 'engaged')
  }
  
  return traits.slice(0, 5) // Limit to 5 traits
}

function createBioLines(profile: TwitterProfile, tweets: Tweet[]): string[] {
  const bioLines: string[] = []
  
  // Add the original bio if it exists
  if (profile.bio && profile.bio.length > 0) {
    bioLines.push(profile.bio)
  }
  
  // Add location if available
  if (profile.location) {
    bioLines.push(`Based in ${profile.location}`)
  }
  
  // Add follower context
  if (profile.followers_count > 1000) {
    bioLines.push(`${profile.followers_count.toLocaleString()} followers on X`)
  }
  
  // Add recent activity insight
  const recentTopics = extractTopics(tweets.slice(0, 3))
  if (recentTopics.length > 0) {
    bioLines.push(`Recently active in: ${recentTopics.join(', ')}`)
  }
  
  return bioLines.slice(0, 4) // Limit to 4 bio lines
}