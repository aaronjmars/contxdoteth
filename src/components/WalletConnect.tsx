'use client'

import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { base } from 'viem/chains'
import { 
  Wallet, 
  ChevronDown, 
  LogOut, 
  AlertTriangle, 
  CheckCircle,
  Copy
} from 'lucide-react'
import { useState } from 'react'

export default function WalletConnect() {
  const { ready, authenticated, user } = usePrivy()
  const { login } = useLogin()
  const { logout } = useLogout()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const isCorrectChain = chainId === base.id
  const currentChain = chainId === base.id ? base : { id: chainId, name: 'Unknown Network' }

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSwitchToBase = () => {
    switchChain({ chainId: base.id })
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!ready) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  if (!authenticated || !isConnected) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isCorrectChain 
            ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100' 
            : 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100'
        }`}
      >
        <div className="flex items-center gap-2">
          {isCorrectChain ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {formatAddress(address || '')}
          </span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Wallet Connected</h3>
            
            {/* Address */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600">Address:</span>
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                {formatAddress(address || '')}
                {copied ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </button>
            </div>

            {/* Chain Status */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600">Network:</span>
              <div className="flex items-center gap-1">
                {isCorrectChain ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                )}
                <span className="text-sm font-medium">
                  {currentChain.name}
                </span>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-600">Connected via:</span>
                <span className="text-sm font-medium capitalize">
                  {user.linkedAccounts?.[0]?.type === 'twitter_oauth' ? 'Twitter' : 'Wallet'}
                </span>
              </div>
            )}

            {/* Chain Warning */}
            {!isCorrectChain && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-orange-700 mb-2">
                  ⚠️ Wrong network detected. Please switch to Base.
                </p>
                <button
                  onClick={handleSwitchToBase}
                  className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded transition-colors"
                >
                  Switch to Base
                </button>
              </div>
            )}

            {/* Contract Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Contract Addresses:</p>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Registry:</span>
                  <span className="text-xs font-mono">{process.env.NEXT_PUBLIC_BASE_REGISTRY_ADDRESS}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Resolver:</span>
                  <span className="text-xs font-mono">{process.env.NEXT_PUBLIC_ETH_RESOLVER_ADDRESS}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3">
            <button
              onClick={() => {
                logout()
                setIsDropdownOpen(false)
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}