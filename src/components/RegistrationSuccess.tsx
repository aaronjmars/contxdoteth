'use client'

import { useState } from 'react'
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Share2,
  Download,
  Brain,
  Hexagon,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import RegistrationVerification from './RegistrationVerification'

interface RegistrationSuccessProps {
  baseName: string
  transactionHash: string
  aiContext: {
    bio?: string[]
    topics?: string[]
    traits?: string[]
    style?: { all?: string[] }
  }
}

export default function RegistrationSuccess({ 
  baseName, 
  transactionHash, 
  aiContext 
}: RegistrationSuccessProps) {
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareProfile = async () => {
    const shareData = {
      title: `Check out my AI-enhanced ENS profile: ${baseName}`,
      text: `I just created an AI-aware .basetest.eth profile that helps AI understand me better!`,
      url: `https://contx.eth/profile/${baseName}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      copyToClipboard(shareData.url, 'share')
    }
  }

  const downloadContext = () => {
    const dataStr = JSON.stringify(aiContext, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${baseName}-ai-context.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-4xl font-semibold mb-4">Success! 🎉</h1>
        <p className="text-xl text-muted">
          Your AI-enhanced ENS profile is now live on Base L2
        </p>
      </div>

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Hexagon className="w-8 h-8 text-primary mr-3" />
            <div>
              <h2 className="text-2xl font-semibold">{baseName}</h2>
              <p className="text-muted">Your AI-enhanced identity</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(baseName, 'name')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Copy basename"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`https://sepolia.basescan.org/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="View transaction"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* AI Context Summary */}
        <div className="bg-secondary p-4 rounded-xl">
          <h3 className="font-semibold mb-3 flex items-center">
            <Brain className="w-4 h-4 mr-2 text-primary" />
            AI Context Stored
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Bio lines:</span>
              <div className="text-muted">{aiContext?.bio?.length || 0} entries</div>
            </div>
            <div>
              <span className="font-medium">Topics:</span>
              <div className="text-muted">{aiContext?.topics?.length || 0} topics</div>
            </div>
            <div>
              <span className="font-medium">Traits:</span>
              <div className="text-muted">{aiContext?.traits?.length || 0} traits</div>
            </div>
            <div>
              <span className="font-medium">Style prefs:</span>
              <div className="text-muted">{aiContext?.style?.all?.length || 0} preferences</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={shareProfile}
            className="btn-primary"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {copied === 'share' ? 'Copied!' : 'Share Profile'}
          </button>
          <button
            onClick={downloadContext}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Context
          </button>
        </div>

        <button
          onClick={() => window.open('https://claude.ai', '_blank')}
          className="w-full btn-ghost"
        >
          <Brain className="w-4 h-4 mr-2" />
          Test with Claude AI
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Registration Verification */}
      <RegistrationVerification baseName={baseName} />

      {/* Next Steps */}
      <div className="card">
        <h3 className="font-semibold mb-4">What is next?</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
              <CheckCircle className="w-3 h-3 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Your profile is live</h4>
              <p className="text-sm text-muted">
                AI agents can now read your context from your ENS profile
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-6 h-6 bg-muted/20 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
              <span className="text-xs font-medium text-muted">2</span>
            </div>
            <div>
              <h4 className="font-medium mb-1">Keep your context updated</h4>
              <p className="text-sm text-muted">
                Return to your dashboard to refresh your AI context from X
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-6 h-6 bg-muted/20 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
              <span className="text-xs font-medium text-muted">3</span>
            </div>
            <div>
              <h4 className="font-medium mb-1">Try with AI agents</h4>
              <p className="text-sm text-muted">
                Use your basename with Claude, ChatGPT, or other AI tools
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <details className="mt-6">
        <summary className="cursor-pointer text-muted hover:text-[#1d1d1f] transition-colors">
          Technical details
        </summary>
        <div className="mt-4 p-4 bg-secondary rounded-xl text-sm font-mono">
          <div className="space-y-2">
            <div>
              <span className="text-muted">Basename:</span> {baseName}
            </div>
            <div>
              <span className="text-muted">Network:</span> Base L2
            </div>
            <div className="flex items-center">
              <span className="text-muted">Transaction:</span>
              <button
                onClick={() => copyToClipboard(transactionHash, 'tx')}
                className="ml-2 text-primary hover:text-primary-hover flex items-center"
              >
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                <Copy className="w-3 h-3 ml-1" />
              </button>
              {copied === 'tx' && (
                <span className="ml-2 text-success text-xs">Copied!</span>
              )}
            </div>
            <div>
              <span className="text-muted">AI Context Fields:</span> ai.bio, ai.style, ai.topics, ai.traits
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}