'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { Plus, ArrowLeft, Wallet, User, LogOut } from 'lucide-react'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { useENS } from '@/lib/hooks/useENS'

export default function DashboardNew() {
  const router = useRouter()
  const { ready, authenticated, login, user, logout } = usePrivy()
  const [username, setUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [registeredName, setRegisteredName] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  
  const { registerBasename, registrationStatus } = useENS()

  const handleRegister = async () => {
    if (!username.trim() || !user?.wallet?.address) return
    
    setIsRegistering(true)
    try {
      // Simple AI context for demo
      const aiContext = {
        bio: [`${username} on Base`],
        topics: ['web3', 'ethereum', 'base'],
        traits: ['curious', 'builder'],
        style: { all: ['friendly', 'concise'] }
      }

      const result = await registerBasename({
        name: username,
        aiContext
      })

      if (result.success) {
        setRegisteredName(result.baseName)
        setTransactionHash(result.transactionHash)
        setRegistrationComplete(true)
      }
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsRegistering(false)
    }
  }

  if (!ready) {
    return (
      <section className="relative overflow-hidden min-h-screen">
        <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20">
          <div className="mb-10 mt-4 md:mt-6">
            <div className="px-2">
              <div className="relative mx-auto h-full max-w-7xl border border-primary/20 p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold mb-4">Loading...</h1>
                  <p className="text-muted-foreground">Initializing connection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!authenticated) {
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
                
                {/* Top Right Wallet Button */}
                <div className="absolute top-6 right-6 z-30">
                  <button
                    onClick={login}
                    disabled={!ready}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-background/50 hover:bg-background/80 border border-primary/20 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-primary">Connect Wallet</span>
                  </button>
                </div>
                
                <h1 
                  onClick={() => router.push('/')}
                  className="flex select-none flex-col px-3 py-2 text-center text-5xl font-semibold leading-none tracking-tight md:flex-col md:text-8xl lg:flex-row lg:text-8xl cursor-pointer hover:opacity-80 transition-opacity"
                >
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
                  Connect Wallet
                </h1>
                
                <div className="flex justify-center gap-2 mt-8 relative z-20">
                  <InteractiveHoverButton 
                    text="Connect Wallet"
                    onClick={login}
                    className="text-lg relative z-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (registrationComplete) {
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
                
                {/* Top Right Wallet Button */}
                <div className="absolute top-6 right-6 z-30">
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-colors"
                    >
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-primary">
                        {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                      </span>
                    </button>
                    <button
                      onClick={logout}
                      className="flex items-center gap-1 px-3 py-2 text-xs bg-background/50 hover:bg-background/80 border border-primary/20 rounded-full transition-colors"
                    >
                      <LogOut className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                
                <h1 
                  onClick={() => router.push('/')}
                  className="flex select-none flex-col px-3 py-2 text-center text-5xl font-semibold leading-none tracking-tight md:flex-col md:text-8xl lg:flex-row lg:text-8xl cursor-pointer hover:opacity-80 transition-opacity"
                >
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
                  Success!
                </h1>
                
                <div className="mt-8 text-center">
                  <p className="text-xl mb-4">🎉 Your basename has been registered!</p>
                  <p className="text-lg font-semibold mb-2">{registeredName}</p>
                  <a 
                    href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    View transaction →
                  </a>
                  
                  <div className="flex justify-center gap-2 mt-8">
                    <InteractiveHoverButton 
                      text="Register Another"
                      onClick={() => {
                        setRegistrationComplete(false)
                        setUsername('')
                        setRegisteredName('')
                        setTransactionHash('')
                      }}
                      className="text-sm px-6 py-3"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
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
              
              {/* Top Right Wallet Button */}
              <div className="absolute top-6 right-6 z-30">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-colors"
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-primary">
                      {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                    </span>
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-background/50 hover:bg-background/80 border border-primary/20 rounded-full transition-colors"
                  >
                    <LogOut className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
              
              <h1 
                onClick={() => router.push('/')}
                className="flex select-none flex-col px-3 py-2 text-center text-5xl font-semibold leading-none tracking-tight md:flex-col md:text-8xl lg:flex-row lg:text-8xl cursor-pointer hover:opacity-80 transition-opacity"
              >
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
                Register Name
              </h1>
              
              <div className="mt-8 max-w-md mx-auto">
                <p className="text-muted-foreground mb-6">
                  Choose your .basetest.eth username
                </p>
                
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="Enter username"
                      className="w-full px-4 py-3 text-lg border border-primary/20 rounded-2xl bg-background/50 backdrop-blur-sm focus:border-primary focus:outline-none"
                      disabled={isRegistering}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {username}.basetest.eth
                    </div>
                  </div>
                  
                  {registrationStatus.error && (
                    <p className="text-red-500 text-sm">{registrationStatus.error}</p>
                  )}
                  
                  <div className="flex justify-center gap-2 mt-6">
                    <InteractiveHoverButton 
                      text={isRegistering ? "Registering..." : "Register Name"}
                      onClick={handleRegister}
                      disabled={!username.trim() || isRegistering || registrationStatus.isLoading}
                      className="text-lg px-8 py-4"
                    />
                  </div>
                  
                  {registrationStatus.price && (
                    <p className="text-sm text-muted-foreground">
                      Price: Free during testnet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}