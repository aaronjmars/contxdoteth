'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'viem/chains'
import { useENS } from '@/lib/hooks/useENS'
import { Loader2, Plus, Edit2, CheckCircle, Wallet, AlertTriangle, ExternalLink } from 'lucide-react'

interface ENSMintOrUpdateProps {
  aiContext: {
    bio?: string[]
    topics?: string[]
    traits?: string[]
    style?: { all?: string[] }
  }
  onSuccess: (baseName: string, txHash: string) => void
  onCancel?: () => void
}

// Helper function to format error messages
const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message
    
    // Handle user rejection
    if (message.includes('User rejected') || message.includes('User denied')) {
      return 'Transaction cancelled by user'
    }
    
    // Handle chain mismatch
    if (message.includes('does not match the target chain')) {
      return 'Wrong network - please switch to Base Sepolia'
    }
    
    // Handle insufficient funds
    if (message.includes('insufficient funds')) {
      return 'Insufficient funds - please get testnet ETH from the faucet'
    }
    
    // Clean up technical error messages
    if (message.includes('ContractFunctionExecutionError')) {
      const cleanMessage = message.split('\n')[0].replace('ContractFunctionExecutionError:', '').trim()
      return cleanMessage || 'Transaction failed'
    }
    
    // For other errors, return first line only
    return message.split('\n')[0].trim()
  }
  
  return 'Transaction failed'
}

export default function ENSMintOrUpdate({ aiContext, onSuccess }: ENSMintOrUpdateProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { getUserENSNames, registerBasename, updateAIContext, checkAvailability, getRegistrationPrice } = useENS()
  
  const [existingNames, setExistingNames] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<'new' | 'existing' | null>(null)
  const [selectedENS, setSelectedENS] = useState<string>('')
  const [newBasename, setNewBasename] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [price, setPrice] = useState<bigint | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isCorrectChain = chainId === baseSepolia.id

  // Load existing ENS names
  useEffect(() => {
    const loadENSNames = async () => {
      setIsLoading(true)
      try {
        const names = await getUserENSNames()
        setExistingNames(names)
      } catch (error) {
        console.error('Failed to load ENS names:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (address) {
      loadENSNames()
    }
  }, [address, getUserENSNames])

  // Check availability when name changes
  useEffect(() => {
    const checkName = async () => {
      if (newBasename.length >= 3) {
        setIsChecking(true)
        setError(null)
        try {
          const available = await checkAvailability(newBasename)
          setIsAvailable(available)
          
          if (available) {
            const namePrice = await getRegistrationPrice(newBasename)
            setPrice(namePrice)
          }
        } catch (error) {
          console.error('Failed to check availability:', error)
          setError('Failed to check availability')
        } finally {
          setIsChecking(false)
        }
      } else {
        setIsAvailable(null)
        setPrice(null)
      }
    }
    
    const timer = setTimeout(checkName, 500) // Debounce
    return () => clearTimeout(timer)
  }, [newBasename, checkAvailability, getRegistrationPrice])

  const handleRegister = async () => {
    // Check chain first
    if (!isCorrectChain) {
      try {
        await switchChain({ chainId: baseSepolia.id })
        // Wait a bit for chain switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (switchError) {
        console.error('Failed to switch chain:', switchError)
        setError('Failed to switch network. Please switch to Base Sepolia manually.')
        return
      }
    }
    
    setIsRegistering(true)
    setError(null)
    
    try {
      if (selectedOption === 'new' && newBasename) {
        // Register new .basetest.eth name
        const result = await registerBasename({
          name: newBasename,
          aiContext,
          duration: 365 * 24 * 60 * 60, // 1 year
        })
        
        if (result.success) {
          onSuccess(result.baseName, result.transactionHash)
        }
      } else if (selectedOption === 'existing' && selectedENS) {
        // Update existing ENS with AI context
        const result = await updateAIContext(selectedENS, aiContext)
        
        if (result.success) {
          onSuccess(selectedENS, result.transactionHash)
        }
      }
    } catch (error) {
      console.error('Registration/update error:', error)
      setError(formatError(error))
    } finally {
      setIsRegistering(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted">Loading your ENS names...</p>
      </div>
    )
  }

  // Show chain warning if not on Base Sepolia
  if (!isCorrectChain) {
    return (
      <div className="card">
        <div className="flex items-start gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">Switch to Base Sepolia</h3>
            <p className="text-sm text-muted mb-4">
              You need to switch to Base Sepolia testnet to deploy your ENS profile.
            </p>
            <button
              onClick={() => switchChain({ chainId: baseSepolia.id })}
              className="btn-primary"
            >
              Switch Network
            </button>
          </div>
        </div>
        
        <div className="bg-secondary p-4 rounded-lg">
          <p className="text-sm text-muted mb-2">Need testnet ETH?</p>
          <a
            href="https://docs.base.org/docs/tools/network-faucets/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
          >
            Get Base Sepolia ETH from faucet
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-6">Deploy AI Context to ENS</h2>
      
      {/* Option Selection */}
      {selectedOption === null && (
        <div className="space-y-4">
          <p className="text-muted mb-4">
            Choose how you want to deploy your AI context:
          </p>
          
          {/* New .basetest.eth option */}
          <button
            onClick={() => setSelectedOption('new')}
            className="w-full p-4 border-2 border-border hover:border-primary rounded-xl transition-colors text-left"
          >
            <div className="flex items-start gap-3">
              <Plus className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Create new .basetest.eth name</h3>
                <p className="text-sm text-muted">
                  Register a new name on Base (affordable & fast)
                </p>
              </div>
            </div>
          </button>
          
          {/* Update existing ENS option */}
          {existingNames.length > 0 && (
            <button
              onClick={() => setSelectedOption('existing')}
              className="w-full p-4 border-2 border-border hover:border-primary rounded-xl transition-colors text-left"
            >
              <div className="flex items-start gap-3">
                <Edit2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Update existing ENS</h3>
                  <p className="text-sm text-muted">
                    Add AI context to your {existingNames.length === 1 ? 'ENS name' : `${existingNames.length} ENS names`}
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      )}
      
      {/* New .basetest.eth name flow */}
      {selectedOption === 'new' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose your .basetest.eth name
            </label>
            <div className="relative">
              <input
                type="text"
                value={newBasename}
                onChange={(e) => setNewBasename(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="yourname"
                className="input pr-24"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                .basetest.eth
              </span>
            </div>
            
            {newBasename.length > 0 && newBasename.length < 3 && (
              <p className="text-sm text-error mt-1">Name must be at least 3 characters</p>
            )}
            
            {isChecking && (
              <p className="text-sm text-muted mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking availability...
              </p>
            )}
            
            {!isChecking && isAvailable === true && (
              <p className="text-sm text-success mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Available!
              </p>
            )}
            
            {!isChecking && isAvailable === false && (
              <p className="text-sm text-error mt-1">
                This name is already taken
              </p>
            )}
          </div>
          
          {price && (
            <div className="bg-secondary p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Registration cost (1 year)</span>
                <span className="font-semibold">
                  {(Number(price) / 1e18).toFixed(4)} ETH
                </span>
              </div>
              <div className="text-xs text-muted">
                ⏱️ Registration is instant and sets up complete resolution
              </div>
              <div className="pt-3 border-t border-border">
                <a
                  href="https://docs.base.org/docs/tools/network-faucets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
                >
                  Need testnet ETH? Get it from the faucet
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedOption(null)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleRegister}
              disabled={!isAvailable || isRegistering || newBasename.length < 3}
              className="btn-primary flex-1"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering (1-2 min)...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Register & Deploy
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Update existing ENS flow */}
      {selectedOption === 'existing' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select ENS name to update
            </label>
            <div className="space-y-2">
              {existingNames.map((name) => (
                <label
                  key={name}
                  className="flex items-center gap-3 p-3 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <input
                    type="radio"
                    name="ens"
                    value={name}
                    checked={selectedENS === name}
                    onChange={(e) => setSelectedENS(e.target.value)}
                    className="text-primary"
                  />
                  <span className="font-medium">{name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedOption(null)
                setSelectedENS('')
              }}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleRegister}
              disabled={!selectedENS || isRegistering}
              className="btn-primary flex-1"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Update ENS
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="mt-4 p-4 bg-error/10 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-error">{error}</p>
              {error.includes('testnet ETH') && (
                <a
                  href="https://docs.base.org/docs/tools/network-faucets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 mt-2"
                >
                  Get testnet ETH from faucet
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {error.includes('Wrong network') && (
                <button
                  onClick={() => switchChain({ chainId: baseSepolia.id })}
                  className="text-xs text-primary hover:text-primary-hover mt-2"
                >
                  Switch to Base Sepolia
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}