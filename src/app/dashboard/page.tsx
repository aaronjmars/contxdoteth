'use client'

import React, { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { usePublicClient } from 'wagmi'
import { Address } from 'viem'
import { Loader2 } from 'lucide-react'
import TwitterConnectionScreen from '@/components/TwitterConnectionScreen'
import RegistrationFlow from '@/components/RegistrationFlow'
import ENSRecordsDisplay from '@/components/ENSRecordsDisplay'
import { useTwitterConnection } from '@/lib/hooks/useTwitterConnection'
import { DynamicGrid } from '@/components/ui/DynamicGrid'

// Contract ABI for checking existing domains
const CONTX_REGISTRY_ABI = [
  {
    inputs: [{ internalType: "string", name: "username", type: "string" }],
    name: "getAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const

// Contract addresses from environment variables
const CONTX_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_BASE_REGISTRY_ADDRESS as Address

export default function Dashboard() {
  const { ready, authenticated, login, user } = usePrivy()
  // const { isConnected } = useAccount() // Not used in this component
  const publicClient = usePublicClient()
  const { needsTwitterConnection } = useTwitterConnection()
  
  // State for checking existing domains
  const [userDomain, setUserDomain] = useState<string | null>(null)
  const [checkingDomain, setCheckingDomain] = useState(true)
  
  // Get Twitter username
  const twitterAccount = user?.linkedAccounts?.find(account => account.type === 'twitter_oauth')
  const twitterUsername = twitterAccount?.username
  
  // Check if user already has a contx.eth domain
  useEffect(() => {
    const checkForExistingDomain = async () => {
      if (!user?.wallet?.address || !publicClient || !twitterUsername) {
        setCheckingDomain(false)
        return
      }
      
      setCheckingDomain(true)
      
      try {
        // First, try the Twitter username as a potential domain
        const potentialUsernames = [
          twitterUsername.toLowerCase(),
          twitterUsername.toLowerCase().replace(/[^a-z0-9]/g, ''),
          // Could add other heuristics here
        ]
        
        let foundDomain = null
        
        for (const username of potentialUsernames) {
          if (username.length < 3) continue
          
          try {
            const address = await publicClient.readContract({
              address: CONTX_REGISTRY_ADDRESS,
              abi: CONTX_REGISTRY_ABI,
              functionName: 'getAddress',
              args: [username]
            })
            
            // Check if this domain belongs to the current user
            if (address.toLowerCase() === user.wallet.address.toLowerCase()) {
              foundDomain = `${username}.contx.eth`
              break
            }
          } catch {
            // Domain doesn't exist, continue
            continue
          }
        }
        
        setUserDomain(foundDomain)
        
      } catch (error) {
      } finally {
        setCheckingDomain(false)
      }
    }
    
    checkForExistingDomain()
  }, [user?.wallet?.address, publicClient, twitterUsername])
  
  const handleSuccessfulRegistration = (username: string) => {
    // After successful registration, update the user's domain
    setUserDomain(`${username}.contx.eth`)
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <section className="relative overflow-hidden min-h-screen">
        {/* Dynamic Tiles Background */}
        <DynamicGrid />
        
        <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20 relative z-10">
          <div className="mb-10 mt-4 md:mt-6">
            <div className="px-2">
              <div className="relative mx-auto h-full max-w-2xl bg-white border border-primary/20 p-8 rounded-2xl shadow-lg">
                
                <div className="pt-8">
                  <h1 className="text-4xl font-semibold mb-4">Connect Your Wallet</h1>
                  <p className="text-muted-foreground mb-8">Get started with your AI-enhanced ENS identity</p>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={login}
                      className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all hover:scale-105 font-semibold shadow-lg z-50 relative"
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show Twitter connection requirement screen if not connected
  if (authenticated && needsTwitterConnection) {
    return <TwitterConnectionScreen />
  }

  // Show loading while checking for existing domain
  if (checkingDomain) {
    return (
      <section className="relative overflow-hidden min-h-screen">
        {/* Dynamic Tiles Background */}
        <DynamicGrid />
        
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking for existing domains...</p>
          </div>
        </div>
      </section>
    )
  }

  // Conditional rendering based on whether user has a domain
  if (userDomain) {
    // User has a domain - show ENS records display
    return <ENSRecordsDisplay userDomain={userDomain} />
  } else {
    // User doesn't have a domain - show registration flow
    return <RegistrationFlow onSuccess={handleSuccessfulRegistration} />
  }
}