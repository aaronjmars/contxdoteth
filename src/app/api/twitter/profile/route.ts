import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { twitterAccessToken, twitterUsername } = await request.json()

    if (!twitterAccessToken || !twitterUsername) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // For now, let's create mock data based on the username
    // In a real implementation, you would use the Twitter API v2 here
    const mockProfile = {
      id: '123456789',
      username: twitterUsername,
      name: `${twitterUsername.charAt(0).toUpperCase() + twitterUsername.slice(1)}`,
      bio: 'Builder, crypto enthusiast, and AI researcher. Exploring the intersection of Web3 and artificial intelligence.',
      followers_count: Math.floor(Math.random() * 10000) + 100,
      following_count: Math.floor(Math.random() * 1000) + 50,
      profile_image_url: `https://api.dicebear.com/7.x/avatars/svg?seed=${twitterUsername}`,
      verified: Math.random() > 0.7,
      created_at: '2020-01-01T00:00:00.000Z',
      location: 'San Francisco, CA',
      website: 'https://example.com',
      public_metrics: {
        followers_count: Math.floor(Math.random() * 10000) + 100,
        following_count: Math.floor(Math.random() * 1000) + 50,
        tweet_count: Math.floor(Math.random() * 5000) + 200,
        listed_count: Math.floor(Math.random() * 100) + 5,
      }
    }

    // Mock recent tweets for analysis
    const mockTweets = [
      {
        id: '1',
        text: `Just shipped a new feature for ${twitterUsername}'s project! Really excited about the possibilities with AI and blockchain integration. The future is here! 🚀`,
        created_at: '2024-01-15T12:00:00.000Z',
        public_metrics: { retweet_count: 12, like_count: 45, reply_count: 8 }
      },
      {
        id: '2',
        text: 'Working on some interesting problems in the Web3 space. The intersection of AI and decentralized systems is fascinating.',
        created_at: '2024-01-14T10:30:00.000Z',
        public_metrics: { retweet_count: 8, like_count: 32, reply_count: 5 }
      },
      {
        id: '3',
        text: 'Coffee thoughts: The best code is the code that doesn\'t need explaining. Keep it simple, keep it clean. ☕',
        created_at: '2024-01-13T09:15:00.000Z',
        public_metrics: { retweet_count: 5, like_count: 28, reply_count: 12 }
      },
      {
        id: '4',
        text: `Really impressed by the latest developments in the ENS ecosystem. The potential for AI-enhanced profiles is huge! Thanks to the ${twitterUsername} community for the inspiration.`,
        created_at: '2024-01-12T16:45:00.000Z',
        public_metrics: { retweet_count: 15, like_count: 67, reply_count: 18 }
      },
      {
        id: '5',
        text: 'Building in public is the best way to learn. Every mistake is a lesson, every success is shared. 🛠️',
        created_at: '2024-01-11T14:20:00.000Z',
        public_metrics: { retweet_count: 22, like_count: 89, reply_count: 25 }
      }
    ]

    return NextResponse.json({
      profile: mockProfile,
      tweets: mockTweets,
      success: true
    })

  } catch (error) {
    console.error('Twitter API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Twitter data' }, { status: 500 })
  }
}