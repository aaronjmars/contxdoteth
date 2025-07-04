'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import BasenameRegistration from '@/components/BasenameRegistration'
import RegistrationSuccess from '@/components/RegistrationSuccess'
import {
  Twitter,
  User,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Hexagon,
  Sparkles,
  Brain,
  Edit3,
  Download,
  Share2,
} from 'lucide-react'

interface AIContext {
  bio: string[]
  style: { [key: string]: string[] }
  topics: string[]
  traits: string[]
}

export default function Dashboard() {
  const { user, linkTwitter, unlinkTwitter } = usePrivy()
  // Removed unused state variables
  const [aiContext, setAiContext] = useState<AIContext | null>(null)
  const [ensName, setEnsName] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [registrationStep, setRegistrationStep] = useState<'pending' | 'registering' | 'completed'>('pending')

  const twitterAccount = user?.twitter
  const hasTwitter = !!twitterAccount

  const handleConnectTwitter = async () => {
    try {
      await linkTwitter()
    } catch (error) {
      console.error('Failed to connect Twitter:', error)
    }
  }

  const handleDisconnectTwitter = async () => {
    try {
      await unlinkTwitter(twitterAccount?.subject || '')
    } catch (error) {
      console.error('Failed to disconnect Twitter:', error)
    }
  }

  const handleGenerateAIContext = async () => {
    if (!hasTwitter) return
    
    setIsGenerating(true)
    try {
      // First, fetch Twitter profile data
      const profileResponse = await fetch('/api/twitter/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twitterAccessToken: 'mock-token', // Privy doesn't expose access tokens directly
          twitterUsername: twitterAccount?.username,
        }),
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch Twitter profile')
      }

      const profileData = await profileResponse.json()

      // Then, generate AI context
      const contextResponse = await fetch('/api/ai/generate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profileData.profile,
          tweets: profileData.tweets,
        }),
      })

      if (!contextResponse.ok) {
        throw new Error('Failed to generate AI context')
      }

      const contextData = await contextResponse.json()
      setAiContext(contextData.aiContext)
    } catch (error) {
      console.error('Error generating AI context:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegistrationSuccess = (baseName: string, txHash: string) => {
    setEnsName(baseName)
    setTransactionHash(txHash)
    setRegistrationStep('completed')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="flex-1 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-[#1d1d1f] mb-2">Dashboard</h1>
          <p className="text-xl text-muted">Manage your AI-enhanced ENS profile</p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-muted">Wallet</h3>
                  <p className="text-lg font-semibold text-[#1d1d1f]">
                    {user?.wallet?.address ? formatAddress(user.wallet.address) : 'Not connected'}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  hasTwitter ? 'bg-primary/10' : 'bg-border'
                }`}>
                  <Twitter className={`w-6 h-6 ${hasTwitter ? 'text-primary' : 'text-muted'}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-muted">X Account</h3>
                  <p className="text-lg font-semibold text-[#1d1d1f]">
                    {hasTwitter ? `@${twitterAccount?.username}` : 'Not connected'}
                  </p>
                </div>
              </div>
              {hasTwitter ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <AlertCircle className="w-5 h-5 text-warning" />
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  aiContext ? 'bg-success/10' : 'bg-border'
                }`}>
                  <Brain className={`w-6 h-6 ${aiContext ? 'text-success' : 'text-muted'}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-muted">AI Context</h3>
                  <p className="text-lg font-semibold text-[#1d1d1f]">
                    {aiContext ? 'Generated' : 'Not generated'}
                  </p>
                </div>
              </div>
              {aiContext ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <AlertCircle className="w-5 h-5 text-warning" />
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Getting Started */}
            {(!hasTwitter || !aiContext) && (
              <div className="card">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-5 h-5 text-primary mr-2" />
                  <h2 className="text-xl font-semibold">Getting Started</h2>
                </div>
                <p className="text-muted mb-6">
                  Create your AI-enhanced ENS profile in just a few steps
                </p>
                
                <div className="space-y-4">
                  {/* Step 1: Connect Twitter */}
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      hasTwitter ? 'bg-success text-white' : 'bg-primary text-white'
                    }`}>
                      {hasTwitter ? <CheckCircle className="w-4 h-4" /> : '1'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Connect your X account</h3>
                      <p className="text-sm text-muted mb-3">
                        We will analyze your profile and recent tweets to understand your style
                      </p>
                      {!hasTwitter ? (
                        <button
                          onClick={handleConnectTwitter}
                          className="btn-primary"
                        >
                          <Twitter className="w-4 h-4 mr-2" />
                          Connect X Account
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-success">✓ Connected as @{twitterAccount?.username}</span>
                          <button
                            onClick={handleDisconnectTwitter}
                            className="text-sm text-muted hover:text-error"
                          >
                            Disconnect
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Generate AI Context */}
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      aiContext ? 'bg-success text-white' : hasTwitter ? 'bg-primary text-white' : 'bg-border text-muted'
                    }`}>
                      {aiContext ? <CheckCircle className="w-4 h-4" /> : '2'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Generate AI context</h3>
                      <p className="text-sm text-muted mb-3">
                        Our AI will create personalized context from your X data
                      </p>
                      {hasTwitter && !aiContext ? (
                        <button
                          onClick={handleGenerateAIContext}
                          disabled={isGenerating}
                          className="btn-primary"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-2" />
                              Generate AI Context
                            </>
                          )}
                        </button>
                      ) : aiContext ? (
                        <span className="text-sm text-success">✓ AI context generated</span>
                      ) : (
                        <span className="text-sm text-muted">Connect X account first</span>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Deploy to ENS */}
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      ensName ? 'bg-success text-white' : aiContext ? 'bg-primary text-white' : 'bg-border text-muted'
                    }`}>
                      {ensName ? <CheckCircle className="w-4 h-4" /> : '3'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Deploy to ENS</h3>
                      <p className="text-sm text-muted mb-3">
                        Create your .base.eth domain with AI context
                      </p>
                      {aiContext && !ensName ? (
                        <button
                          onClick={() => setRegistrationStep('registering')}
                          className="btn-primary"
                          disabled={!aiContext}
                        >
                          <Hexagon className="w-4 h-4 mr-2" />
                          Create ENS Profile
                        </button>
                      ) : ensName ? (
                        <span className="text-sm text-success">✓ Deployed to {ensName}</span>
                      ) : (
                        <span className="text-sm text-muted">Generate AI context first</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ENS Registration */}
            {registrationStep === 'registering' && aiContext && (
              <BasenameRegistration
                aiContext={aiContext}
                onSuccess={handleRegistrationSuccess}
              />
            )}

            {/* Registration Success */}
            {registrationStep === 'completed' && ensName && transactionHash && aiContext && (
              <RegistrationSuccess
                baseName={ensName}
                transactionHash={transactionHash}
                aiContext={aiContext}
              />
            )}

            {/* AI Context Preview */}
            {aiContext && registrationStep === 'pending' && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">AI Context Preview</h2>
                  <button className="btn-secondary text-sm">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                </div>
                
                <div className="space-y-4">
                  {aiContext.bio && aiContext.bio.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Bio Lines</h3>
                      <div className="space-y-1">
                        {aiContext.bio.map((line, index) => (
                          <p key={index} className="text-sm text-muted bg-secondary p-2 rounded-lg">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiContext.topics && aiContext.topics.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Topics</h3>
                      <div className="flex flex-wrap gap-2">
                        {aiContext.topics.map((topic, index) => (
                          <span key={index} className="badge-primary">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiContext.traits && aiContext.traits.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Personality Traits</h3>
                      <div className="flex flex-wrap gap-2">
                        {aiContext.traits.map((trait, index) => (
                          <span key={index} className="badge">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiContext.style && (
                    <div>
                      <h3 className="font-semibold mb-2">Communication Style</h3>
                      <div className="flex flex-wrap gap-2">
                        {aiContext.style.all?.map((style, index) => (
                          <span key={index} className="badge">
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-xl hover:bg-secondary transition-colors">
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-3 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Update Context</div>
                      <div className="text-xs text-muted">Refresh from X</div>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-3 rounded-xl hover:bg-secondary transition-colors">
                  <div className="flex items-center">
                    <Brain className="w-4 h-4 mr-3 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Test AI Chat</div>
                      <div className="text-xs text-muted">Try with Claude</div>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-3 rounded-xl hover:bg-secondary transition-colors">
                  <div className="flex items-center">
                    <Share2 className="w-4 h-4 mr-3 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Share Profile</div>
                      <div className="text-xs text-muted">Get link</div>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-3 rounded-xl hover:bg-secondary transition-colors">
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-3 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Export Data</div>
                      <div className="text-xs text-muted">Download JSON</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="card">
              <h3 className="font-semibold mb-4">Profile Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Context Fields</span>
                  <span className="text-sm font-medium">
                    {aiContext ? Object.keys(aiContext).length : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Last Updated</span>
                  <span className="text-sm font-medium">
                    {aiContext ? 'Just now' : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">AI Interactions</span>
                  <span className="text-sm font-medium">0</span>
                </div>
              </div>
            </div>

            {/* Raw JSON Preview */}
            {aiContext && (
              <div className="card">
                <h3 className="font-semibold mb-4">Raw JSON</h3>
                <div className="bg-secondary p-3 rounded-lg">
                  <pre className="text-xs text-muted font-mono overflow-x-auto">
                    {JSON.stringify(aiContext, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(aiContext, null, 2))}
                  className="mt-3 text-xs text-primary hover:text-primary-hover"
                >
                  Copy to clipboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}