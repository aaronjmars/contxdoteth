'use client'

import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Hero } from '@/components/Hero'

export default function LandingPage() {
  const router = useRouter()
  const { ready, authenticated } = usePrivy()
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false)

  // Handle OAuth callback redirect
  useEffect(() => {
    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search)
    const isOAuthCallback = urlParams.has('privy_oauth_state') || urlParams.has('privy_oauth_code')
    
    if (isOAuthCallback) {
      setIsProcessingOAuth(true)
      
      if (ready && authenticated) {
        // Clear the URL parameters and redirect to dashboard
        window.history.replaceState({}, '', window.location.pathname)
        // Add a small delay to ensure state is fully updated
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      }
      // Set a timeout to stop loading if authentication doesn't complete
      const timeout = setTimeout(() => {
        if (!authenticated) {
          setIsProcessingOAuth(false)
          console.warn('OAuth authentication timed out')
        }
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeout)
    } else {
      setIsProcessingOAuth(false)
    }
  }, [ready, authenticated, router])

  // Show loading state during OAuth processing
  if (isProcessingOAuth && !authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">Connecting your account</h2>
          <p className="text-muted mb-6">Please wait while we complete the sign-in process...</p>
          <button
            onClick={() => {
              setIsProcessingOAuth(false)
              window.history.replaceState({}, '', window.location.pathname)
            }}
            className="text-sm text-primary hover:text-primary-hover"
          >
            Having trouble? Click here to try again
          </button>
        </div>
      </div>
    )
  }

  return <Hero />
}