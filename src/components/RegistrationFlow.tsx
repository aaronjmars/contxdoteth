'use client'

import React, { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets'
import { Address } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AtSign,
  // Sparkles, // Not used in this component
  Globe,
  User,
  Plus
} from 'lucide-react'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
// import { useTwitterConnection } from '@/lib/hooks/useTwitterConnection' // Not used in this component
// import { Tiles } from '@/components/ui/tiles' // Replaced with manual grid
import { DynamicGrid } from '@/components/ui/DynamicGrid'

// Contract ABIs for custom ENS implementation
const CONTX_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "string", name: "username", type: "string" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "bio", type: "string" }
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "username", type: "string" }],
    name: "getAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "username", type: "string" },
      { internalType: "string[]", name: "keys", type: "string[]" },
      { internalType: "string[]", name: "values", type: "string[]" }
    ],
    name: "updateFields",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
] as const

// Contract addresses from environment variables
const CONTX_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_BASE_REGISTRY_ADDRESS as Address

interface RegistrationState {
  status: 'idle' | 'checking' | 'registering' | 'success' | 'error'
  message: string
  txHash?: string
}

interface RegistrationFlowProps {
  onSuccess?: (username: string) => void
}

export default function RegistrationFlow({ onSuccess }: RegistrationFlowProps) {
  const { user, logout } = usePrivy()
  const { isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const smartWallets = useSmartWallets()
  
  // Get Twitter username
  const twitterAccount = user?.linkedAccounts?.find(account => account.type === 'twitter_oauth')
  const twitterUsername = twitterAccount?.username
  
  // Registration states
  const [username, setUsername] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    status: 'idle',
    message: ''
  })
  const [addressCopied, setAddressCopied] = useState(false)
  
  // Real ENS availability check
  useEffect(() => {
    if (!username || username.length < 3 || !publicClient) {
      setIsAvailable(null)
      return
    }
    
    const timer = setTimeout(async () => {
      setRegistrationState({ status: 'checking', message: 'Checking availability...' })
      
      try {
        
        let available = true
        let existingAddress = '0x0000000000000000000000000000000000000000'
        
        try {
          // Check if username exists in ContxRegistry
          existingAddress = await publicClient.readContract({
            address: CONTX_REGISTRY_ADDRESS,
            abi: CONTX_REGISTRY_ABI,
            functionName: 'getAddress',
            args: [username]
          })
          
          // If address is not 0x0, username is taken
          available = existingAddress === '0x0000000000000000000000000000000000000000'
          
        } catch {
          // If contract call fails (username doesn't exist), it's available
          available = true
          existingAddress = '0x0000000000000000000000000000000000000000'
        }
        
        
        setIsAvailable(available)
        setRegistrationState({
          status: 'idle',
          message: available ? `${username}.contx.eth is available!` : `${username}.contx.eth is taken`
        })
      } catch {
        setRegistrationState({
          status: 'error',
          message: 'Failed to check availability - please try again'
        })
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [username, publicClient])
  
  const handleRegister = async () => {
    if (!username || !isAvailable) return
    
    setRegistrationState({ status: 'registering', message: 'Preparing registration...' })
    
    try {
      // Log wallet information for debugging smart wallet setup
      console.log('🚀 Starting registration process...')
      console.log('👤 User info:', user)
      console.log('🔗 Connected wallet:', isConnected)
      console.log('💳 Wallet client type:', walletClient)
      console.log('🧩 Smart wallets object:', smartWallets)
      console.log('🎮 Smart wallet client:', smartWallets?.client)
      console.log('🔧 Smart wallet client available:', !!smartWallets?.client)
      
      // Check for smart wallet vs embedded wallet
      const smartWallet = user?.linkedAccounts?.find(account => account.type === 'smart_wallet')
      const embeddedWallet = user?.linkedAccounts?.find(account => account.type === 'wallet') || user?.wallet
      
      console.log('🧠 Smart wallet found:', smartWallet)
      console.log('💎 Embedded wallet found:', embeddedWallet)
      
      if (smartWallet) {
        console.log('✅ Using Smart Wallet for transaction')
        console.log('📍 Smart Wallet Address:', smartWallet.address)
        console.log('⛓️ Smart Wallet Chain:', (smartWallet as unknown as { chainId?: string }).chainId || 'unknown')
        console.log('🏗️ Smart Wallet Type:', (smartWallet as unknown as { walletClientType?: string }).walletClientType || 'unknown')
      } else if (embeddedWallet) {
        console.log('⚠️ Using Embedded Wallet (not smart wallet)')
        console.log('📍 Embedded Wallet Address:', embeddedWallet.address)
      } else {
        console.log('❌ No wallet found!')
      }
      
      // Log Alchemy configuration
      console.log('🌍 Alchemy Smart Wallet Configuration:')
      console.log('  Bundler URL:', process.env.NEXT_PUBLIC_ALCHEMY_BUNDLER_URL)
      console.log('  Paymaster URL:', process.env.NEXT_PUBLIC_ALCHEMY_PAYMASTER_URL)
      console.log('  Gas Policy ID:', process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID)
      
      // Check if we're in a smart wallet context
      if (!smartWallet) {
        console.log('⚠️ WARNING: No smart wallet detected - gas will NOT be sponsored!')
        console.log('💡 Smart wallets must be enabled in Privy Dashboard for gas sponsorship')
      }
      // Step 1: Generate AI context from Twitter
      setRegistrationState({ status: 'registering', message: 'Analyzing Twitter profile...' })
      
      // Ensure we have a connected Twitter account
      if (!twitterUsername) {
        throw new Error('Twitter account must be connected to generate AI context')
      }

      const contextResponse = await fetch('/api/ai/generate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          twitterUsername: twitterUsername
        })
      })
      
      if (!contextResponse.ok) {
        const errorData = await contextResponse.json()
        throw new Error(errorData.error || 'Failed to generate AI context')
      }
      
      const contextResult = await contextResponse.json()
      
      if (!contextResult.success) {
        throw new Error(contextResult.error || 'AI context generation failed')
      }
      
      // Step 2: Process registration data via x-data API
      setRegistrationState({ status: 'registering', message: 'Processing registration data...' })
      
      const registrationResponse = await fetch('/api/x-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          walletAddress: user?.wallet?.address,
          aiContext: contextResult.aiContext,
          twitterUsername
        })
      })
      
      if (!registrationResponse.ok) {
        const errorData = await registrationResponse.json()
        throw new Error(errorData.error || 'Registration processing failed')
      }
      
      const registrationResult = await registrationResponse.json()
      
      if (!registrationResult.success) {
        throw new Error('Registration data processing failed')
      }
      
      // Step 3: Register the username via ContxRegistry
      setRegistrationState({ status: 'registering', message: 'Minting ENS name on Base...' })
      
      if (!walletClient || !publicClient || !isConnected) {
        throw new Error('Wallet not connected')
      }
      
      const bio = registrationResult.ensRecords['bio'] || ''
      const displayName = registrationResult.ensRecords['name'] || username
      
      console.log('💰 About to send registration transaction...')
      console.log('📝 Transaction details:', {
        contract: CONTX_REGISTRY_ADDRESS,
        function: 'register',
        args: [username, displayName, bio],
        from: user?.wallet?.address || 'unknown'
      })
      
      const registerHash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'register',
        args: [username, displayName, bio]
      })
      
      console.log('✅ Registration transaction sent!')
      console.log('🔗 Transaction hash:', registerHash)
      console.log('💡 If using smart wallet, gas should be sponsored by Alchemy paymaster')
      
      setRegistrationState({ status: 'registering', message: `Transaction sent, waiting for confirmation...` })
      
      const registerReceipt = await publicClient.waitForTransactionReceipt({ hash: registerHash })
      
      if (registerReceipt.status !== 'success') {
        throw new Error(`Registration transaction failed`)
      }
      
      // Step 4: Set AI context text records
      setRegistrationState({ status: 'registering', message: 'Setting AI context records...' })
      
      const allRecords = Object.entries(registrationResult.ensRecords)
      const keys = allRecords.map(([key]) => key)
      const values = allRecords.map(([, value]) => String(value))
      
      console.log('📝 About to send text records transaction...')
      console.log('🔑 Keys to set:', keys)
      console.log('📄 Number of records:', allRecords.length)
      
      const textHash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'updateFields',
        args: [username, keys, values]
      })
      
      console.log('✅ Text records transaction sent!')
      console.log('🔗 Transaction hash:', textHash)
      
      const textReceipt = await publicClient.waitForTransactionReceipt({ hash: textHash })
      
      console.log('🎉 Text records transaction confirmed!')
      console.log('📊 Transaction receipt:', textReceipt)
      
      setRegistrationState({
        status: 'success',
        message: `Successfully registered ${username}.contx.eth with AI context!`,
        txHash: registerHash
      })
      
      if (onSuccess) {
        onSuccess(username)
      }
      
    } catch (error) {
      setRegistrationState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Registration failed'
      })
    }
  }
  
  const resetRegistration = () => {
    setUsername('')
    setIsAvailable(null)
    setRegistrationState({ status: 'idle', message: '' })
  }

  // Success state
  if (registrationState.status === 'success') {
    return (
      <section className="relative overflow-hidden min-h-screen">
        {/* Dynamic Tiles Background */}
        <DynamicGrid />
        
        {/* Top Right Account Info - Fixed to screen */}
        <div className="fixed top-6 right-6 z-50">
          <div className="flex items-center gap-4">
            {twitterUsername && (
              <div className="flex items-center gap-3 px-5 py-3 text-sm bg-white border border-blue-200 rounded-full shadow-sm">
                <AtSign className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">{twitterUsername}</span>
              </div>
            )}
            
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-3 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-colors shadow-sm"
            >
              <LogOut className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20 relative z-10">
          <div className="mb-10 mt-4 md:mt-6">
            <div className="px-2">
              <div className="relative mx-auto h-full max-w-2xl bg-white border border-primary/20 p-8 rounded-2xl shadow-lg">
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
                
                
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-8"
                >
                  <div className="mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <h1 className="text-4xl font-semibold mb-4">Success! 🎉</h1>
                    <p className="text-xl mb-2">Your AI-enhanced ENS name is ready</p>
                    <p className="text-2xl font-bold text-primary mb-4">{username}.contx.eth</p>
                  </div>
                  
                  {registrationState.txHash && (
                    <a 
                      href={`https://basescan.org/tx/${registrationState.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm mb-8 inline-block"
                    >
                      View transaction →
                    </a>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <InteractiveHoverButton 
                      text="Register Another"
                      onClick={resetRegistration}
                      className="text-sm px-6 py-3 z-50 relative"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden min-h-screen">
      {/* Dynamic Tiles Background */}
      <DynamicGrid />
      
      {/* Top Right Account Info - Fixed to screen */}
      <div className="fixed top-6 right-6 z-50">
        <div className="flex items-center gap-4">
          {twitterUsername && (
            <div className="flex items-center gap-3 px-5 py-3 text-sm bg-white border border-blue-200 rounded-full shadow-sm">
              <AtSign className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 font-medium">{twitterUsername}</span>
            </div>
          )}
          
          <button
            onClick={async () => {
              if (user?.wallet?.address) {
                try {
                  await navigator.clipboard.writeText(user.wallet.address)
                  setAddressCopied(true)
                  setTimeout(() => setAddressCopied(false), 2000)
                } catch {
                }
              }
            }}
            className="flex items-center gap-3 px-5 py-3 text-sm bg-white border border-primary/30 rounded-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
            title={addressCopied ? "Address copied!" : "Click to copy address"}
          >
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium">
              {addressCopied ? 'Copied!' : `${user?.wallet?.address?.slice(0, 6)}...${user?.wallet?.address?.slice(-4)}`}
            </span>
          </button>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-3 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-colors shadow-sm"
          >
            <LogOut className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20 relative z-10">
        <div className="mb-10 mt-4 md:mt-6">
          <div className="px-2">
            <div className="relative mx-auto h-full max-w-2xl bg-white border border-primary/20 p-8 rounded-2xl shadow-lg">
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
              
              
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8"
              >
                <div className="mb-8">
                  <h1 className="text-4xl font-semibold mb-4">Claim Your Identity</h1>
                  <p className="text-xl text-muted-foreground mb-2">
                    Create an AI-enhanced ENS name on Base
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Powered by your connected Twitter account (@{twitterUsername})
                  </p>
                </div>

                {/* Username Input */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose your username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      placeholder="Enter username"
                      className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      disabled={registrationState.status === 'registering'}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <AnimatePresence mode="wait">
                        {registrationState.status === 'checking' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                          </motion.div>
                        )}
                        {isAvailable === true && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </motion.div>
                        )}
                        {isAvailable === false && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <XCircle className="h-5 w-5 text-red-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  {/* Domain Preview */}
                  {username && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 text-center"
                    >
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        <Globe className="w-4 h-4" />
                        {username}.contx.eth
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Status Message */}
                  <AnimatePresence>
                    {registrationState.message && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mt-3 text-sm text-center ${
                          registrationState.status === 'error' ? 'text-red-600' :
                          isAvailable === true ? 'text-green-600' :
                          isAvailable === false ? 'text-red-600' :
                          'text-gray-600'
                        }`}
                      >
                        {registrationState.message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Registration Button */}
                <div className="space-y-4">
                  <InteractiveHoverButton
                    text={registrationState.status === 'registering' ? 'Processing...' : `Register ${username && `${username}.contx.eth`}`}
                    onClick={handleRegister}
                    disabled={!username || !isAvailable || registrationState.status === 'registering'}
                    className="w-full text-lg py-4 z-50 relative"
                  />
                  
                  {registrationState.status === 'registering' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {registrationState.message}
                    </div>
                  )}
                  
                  {isAvailable && registrationState.status === 'idle' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-center text-gray-500 space-y-1"
                    >
                      <p>✨ AI context will be generated from @{twitterUsername}</p>
                      <p>🔗 ENS name will be minted on Base</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}