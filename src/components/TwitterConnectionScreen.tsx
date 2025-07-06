'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowLeft, MessageCircle, Check, Plus } from 'lucide-react'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { DynamicGrid } from '@/components/ui/DynamicGrid'

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
      {/* Dynamic Tiles Background */}
      <DynamicGrid />
      
      <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20 relative z-10">
        <div className="mb-10 mt-4 md:mt-6">
          <div className="px-2">
            <div className="relative mx-auto h-full max-w-2xl border border-primary/20 p-8 rounded-2xl [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)]">
              <Plus
                strokeWidth={4}
                className="text-primary absolute -left-5 -top-5 h-10 w-10"
              />
              <Plus
                strokeWidth={4}
                className="text-primary absolute -bottom-5 -left-5 h-10 w-10"
              />
              <Plus
                strokeWidth={4}
                className="text-primary absolute -right-5 -top-5 h-10 w-10"
              />
              <Plus
                strokeWidth={4}
                className="text-primary absolute -bottom-5 -right-5 h-10 w-10"
              />
              
              <button
                onClick={() => router.push('/')}
                className="absolute top-6 left-6 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors z-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </button>
              
              <div className="text-center pt-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${
                  linkingSuccess ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {linkingSuccess ? (
                    <Check className="w-8 h-8 text-green-500" />
                  ) : (
                    <MessageCircle className="w-8 h-8 text-blue-500" />
                  )}
                </div>
                
                <h1 className="text-4xl font-semibold mb-4">
                  Twitter connection required
                </h1>
                
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  To continue using the platform, please connect your Twitter account to create rich AI profiles with your social context and communication style.
                </p>
                
                {!linkingSuccess && (
                  <div className="flex justify-center">
                    <InteractiveHoverButton 
                      text={isConnecting ? 'Connecting...' : 'Connect Twitter'}
                      onClick={handleConnectTwitter}
                      disabled={isConnecting}
                      className="text-lg z-50 relative"
                    />
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-6">
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