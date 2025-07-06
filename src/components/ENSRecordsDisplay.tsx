'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { usePublicClient, useWalletClient } from 'wagmi'
import { Address } from 'viem'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AtSign,
  Globe,
  // Search, // Not used in this component
  Edit3,
  Save,
  X,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
// import { Tiles } from '@/components/ui/tiles' // Replaced with manual grid
import { DynamicGrid } from '@/components/ui/DynamicGrid'

// Contract ABIs for custom ENS implementation
const CONTX_REGISTRY_ABI = [
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
  {
    inputs: [
      { internalType: "string", name: "username", type: "string" },
      { internalType: "string[]", name: "keys", type: "string[]" }
    ],
    name: "getFields",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "username", type: "string" }],
    name: "getFieldNames",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "username", type: "string" },
      { internalType: "string", name: "key", type: "string" }
    ],
    name: "getText",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
] as const

// Contract addresses from environment variables
const CONTX_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_BASE_REGISTRY_ADDRESS as Address

// Multiple RPC URLs for rate limit handling
const BASE_RPC_URLS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  process.env.NEXT_PUBLIC_BASE_RPC_URL_BACKUP || 'https://base.llamarpc.com',
  'https://base.drpc.org',
  'https://1rpc.io/base',
]

interface ENSRecordsDisplayProps {
  userDomain: string
}

interface EditingRecord {
  key: string
  value: string
  isEditing: boolean
}

// Utility function to try multiple RPC endpoints for contract reads
async function tryMultipleRPCs<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: (client: any) => Promise<T>,
  maxRetries: number = BASE_RPC_URLS.length
): Promise<T> {
  const { createPublicClient, http } = await import('viem')
  const { base } = await import('viem/chains')
  
  for (let i = 0; i < Math.min(maxRetries, BASE_RPC_URLS.length); i++) {
    try {
      const client = createPublicClient({
        chain: base,
        transport: http(BASE_RPC_URLS[i]),
      })
      
      const result = await operation(client)
      return result
    } catch (error) {
      
      if (i === Math.min(maxRetries, BASE_RPC_URLS.length) - 1) {
        throw error
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  throw new Error('All RPC endpoints failed')
}

export default function ENSRecordsDisplay({ userDomain }: ENSRecordsDisplayProps) {
  const router = useRouter()
  const { user, logout } = usePrivy()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  // Get Twitter username
  const twitterAccount = user?.linkedAccounts?.find(account => account.type === 'twitter_oauth')
  const twitterUsername = twitterAccount?.username
  
  // State for records
  const [records, setRecords] = useState<{ [key: string]: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRecords, setEditingRecords] = useState<EditingRecord[]>([])
  const [updateLoading, setUpdateLoading] = useState(false)
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())
  const [addressCopied, setAddressCopied] = useState(false)
  
  // Load ENS records
  useEffect(() => {
    loadRecords()
  }, [userDomain]) // eslint-disable-line react-hooks/exhaustive-deps
  
  const loadRecords = async () => {
    if (!userDomain || !publicClient) return
    
    setLoading(true)
    setError(null)
    
    try {
      const username = userDomain.replace('.contx.eth', '')
      
      // First check if the username exists
      let userExists = false
      try {
        const address = await publicClient.readContract({
          address: CONTX_REGISTRY_ADDRESS,
          abi: CONTX_REGISTRY_ABI,
          functionName: 'getAddress',
          args: [username]
        })
        userExists = address !== '0x0000000000000000000000000000000000000000'
      } catch {
        userExists = false
      }
      
      if (!userExists) {
        setError(`${userDomain} is not registered`)
        return
      }
      
      // Check all possible fields that could exist
      const allPossibleFields = [
        'name', 'bio', 'lore', 'messageExamples', 'postExamples', 'adjectives', 'topics', 'style', 'knowledge', 'avatar', 'description',
        'ai.bio', 'ai.style', 'ai.topics', 'ai.traits', 'ai.updated', 'ai.version',
        'keywords', 'x.twitter', 'x.processed', 'x.version'
      ]
      
      // Check each field individually using RPC failover
      const existingRecords: { [key: string]: string } = {}
      for (const field of allPossibleFields) {
        try {
          const value = await tryMultipleRPCs(async (client) => {
            return await client.readContract({
              address: CONTX_REGISTRY_ADDRESS,
              abi: CONTX_REGISTRY_ABI,
              functionName: 'getText',
              args: [username, field]
            })
          })
          
          if (value && value.length > 0) {
            existingRecords[field] = value
          }
        } catch {
          // Field doesn't exist or is empty, skip it
        }
      }
      
      setRecords(existingRecords)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch records')
    } finally {
      setLoading(false)
    }
  }
  
  const handleEditRecord = (key: string, value: string) => {
    setEditingRecords([{ key, value, isEditing: true }])
  }
  
  const handleSaveRecord = async () => {
    if (!editingRecords.length || !walletClient || !publicClient) return
    
    setUpdateLoading(true)
    
    try {
      const { key, value } = editingRecords[0]
      const username = userDomain.replace('.contx.eth', '')
      
      const updateHash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'updateFields',
        args: [username, [key], [value]]
      })
      
      await publicClient.waitForTransactionReceipt({ hash: updateHash })
      
      // Update local state
      setRecords(prev => prev ? { ...prev, [key]: value } : { [key]: value })
      setEditingRecords([])
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update record')
    } finally {
      setUpdateLoading(false)
    }
  }
  
  const handleCancelEdit = () => {
    setEditingRecords([])
  }
  
  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedRecords)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedRecords(newExpanded)
  }
  
  // Format field labels
  const getFieldLabel = (key: string): string => {
    const fieldLabels: { [key: string]: string } = {
      'name': 'Display Name',
      'bio': 'Biography',
      'lore': 'Background Story',
      'messageExamples': 'Message Examples',
      'postExamples': 'Post Examples',
      'adjectives': 'Personality Traits',
      'topics': 'Interests & Topics',
      'style': 'Communication Style',
      'knowledge': 'Areas of Expertise',
      'avatar': 'Profile Picture',
      'description': 'Description',
      'ai.bio': 'AI Biography',
      'ai.style': 'AI Communication Style',
      'ai.topics': 'AI Topics',
      'ai.traits': 'AI Personality Traits',
      'ai.updated': 'AI Last Updated',
      'ai.version': 'AI Context Version',
      'keywords': 'Keywords',
      'x.twitter': 'Twitter Handle',
      'x.processed': 'Processing Date',
      'x.version': 'Data Version'
    }
    
    return fieldLabels[key] || key
  }
  
  // Get field icon
  const getFieldIcon = (fieldKey: string) => {
    if (['messageExamples', 'postExamples'].includes(fieldKey)) return '💬'
    if (['topics', 'knowledge', 'ai.topics'].includes(fieldKey)) return '🎯'
    if (['adjectives', 'style', 'ai.style', 'ai.traits'].includes(fieldKey)) return '✨'
    if (fieldKey === 'lore') return '📖'
    if (fieldKey === 'avatar') return '🖼️'
    if (fieldKey.startsWith('ai.')) return '🤖'
    if (fieldKey.startsWith('x.')) return '🐦'
    return '📝'
  }
  
  const formatValue = (value: string): string => {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.join(', ')
      } else if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2)
      }
    } catch {
      // Not JSON, use as-is
    }
    return value
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
                } catch (err) {
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
            <div className="relative mx-auto h-full max-w-4xl bg-white border border-primary/20 p-8 rounded-2xl shadow-lg">
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
                <div className="mb-12 mt-8">
                  <h1 className="text-4xl font-semibold mb-6">Your ENS Profile</h1>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Globe className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-primary">{userDomain}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage your AI-enhanced ENS records
                  </p>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-16 mb-8">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Loading your ENS records...</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-8"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      {error}
                    </div>
                  </motion.div>
                )}

                {/* Records Display */}
                {records && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 mb-8">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-700">
                        Found {Object.keys(records).length} records
                      </span>
                    </div>

                    {Object.keys(records).length === 0 ? (
                      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-center">
                        <p className="mb-4">This domain is registered but has no text records set.</p>
                        <InteractiveHoverButton
                          text="Register New Domain"
                          onClick={() => router.push('/dashboard')}
                          className="text-sm px-6 py-3 z-50 relative"
                        />
                      </div>
                    ) : (
                      <div className="grid gap-6 text-left">
                        {Object.entries(records).map(([key, value]) => {
                          const isEditing = editingRecords.some(r => r.key === key && r.isEditing)
                          const editingRecord = editingRecords.find(r => r.key === key)
                          const isExpanded = expandedRecords.has(key)
                          const displayValue = formatValue(value)
                          const shouldTruncate = displayValue.length > 100
                          
                          return (
                            <div key={key} className="p-6 bg-gray-50 rounded-xl">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">{getFieldIcon(key)}</span>
                                    <div className="font-medium text-gray-900 text-sm">{getFieldLabel(key)}</div>
                                    {shouldTruncate && (
                                      <button
                                        onClick={() => toggleExpanded(key)}
                                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 z-50 relative"
                                      >
                                        {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        {isExpanded ? 'Less' : 'More'}
                                      </button>
                                    )}
                                  </div>
                                  
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={editingRecord?.value || ''}
                                        onChange={(e) => setEditingRecords([{ ...editingRecord!, value: e.target.value }])}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                        rows={4}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleSaveRecord}
                                          disabled={updateLoading}
                                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50 z-50 relative"
                                        >
                                          {updateLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 z-50 relative"
                                        >
                                          <X className="w-3 h-3" />
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-600 text-sm break-all whitespace-pre-wrap">
                                      {shouldTruncate && !isExpanded 
                                        ? `${displayValue.substring(0, 100)}...`
                                        : displayValue || <span className="italic text-gray-400">(empty)</span>
                                      }
                                    </div>
                                  )}
                                </div>
                                
                                {!isEditing && (
                                  <button
                                    onClick={() => handleEditRecord(key, value)}
                                    className="text-primary hover:text-primary/80 p-1 z-50 relative"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-12 mt-8 border-t border-gray-200">
                      <InteractiveHoverButton
                        text="Refresh Records"
                        onClick={loadRecords}
                        className="text-sm px-6 py-3 z-50 relative"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}