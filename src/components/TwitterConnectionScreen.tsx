'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowLeft, MessageCircle, Check } from 'lucide-react'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

export default function TwitterConnectionScreen() {
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
    }
  }, [user?.linkedAccounts, isConnecting, router])

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
    <section className="relative overflow-hidden min-h-screen">
      <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20">
        <div className="mb-10 mt-4 md:mt-6">
          <div className="px-2">
            <div className="relative mx-auto h-full max-w-7xl border border-primary/20 p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
              <button
                onClick={() => router.push('/')}
                className="absolute top-6 left-6 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </button>
              
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${
                  linkingSuccess ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {linkingSuccess ? (
                    <Check className="w-8 h-8 text-green-500" />
                  ) : (
                    <MessageCircle className="w-8 h-8 text-blue-500" />
                  )}
                </div>
                
                <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                  Twitter connection required
                </h1>
                
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  To continue using the platform, please connect your Twitter account to create rich AI profiles with your social context and communication style.
                </p>
                
                {!linkingSuccess && (
                  <div className="flex justify-center">
                    <InteractiveHoverButton 
                      text={isConnecting ? 'Connecting...' : 'Connect Twitter'}
                      onClick={handleConnectTwitter}
                      disabled={isConnecting}
                      className="text-lg relative z-20"
                    />
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-6">
                  This step is required to use the platform
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}