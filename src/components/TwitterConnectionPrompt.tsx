'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { MessageCircle, Check, X } from 'lucide-react'

interface TwitterConnectionPromptProps {
  onClose: () => void
}

export default function TwitterConnectionPrompt({ onClose }: TwitterConnectionPromptProps) {
  const router = useRouter()
  const { linkTwitter, user } = usePrivy()
  const [isConnecting, setIsConnecting] = useState(false)
  const [linkingSuccess, setLinkingSuccess] = useState(false)

  // Check if Twitter was successfully linked
  useEffect(() => {
    const hasTwitter = user?.linkedAccounts?.some(account => account.type === 'twitter_oauth')
    if (hasTwitter && isConnecting) {
      setLinkingSuccess(true)
      // Redirect immediately to dashboard
      router.push('/dashboard')
      onClose()
    }
  }, [user?.linkedAccounts, isConnecting, onClose, router])

  const handleConnectTwitter = async () => {
    try {
      setIsConnecting(true)
      await linkTwitter()
      // Success will be handled by useEffect
    } catch (error) {
      console.error('Failed to connect Twitter:', error)
      setIsConnecting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
            linkingSuccess ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {linkingSuccess ? (
              <Check className="w-6 h-6 text-green-500" />
            ) : (
              <MessageCircle className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Twitter connection required
          </h2>
          <p className="text-gray-600 text-sm">
            To continue, please connect your Twitter account to create rich AI profiles with your social context and communication style.
          </p>
        </div>

        {!linkingSuccess && (
          <div className="space-y-3">
            <button
              onClick={handleConnectTwitter}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Connect Twitter
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          Connect to access all platform features
        </div>
      </div>
    </div>
  )
}