'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { Address } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Wallet, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AtSign,
  Sparkles,
  Globe,
  User,
  Search
} from 'lucide-react'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import TwitterConnectionScreen from '@/components/TwitterConnectionScreen'
import { useTwitterConnection } from '@/lib/hooks/useTwitterConnection'

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
const CONTX_RESOLVER_ADDRESS = process.env.NEXT_PUBLIC_ETH_RESOLVER_ADDRESS as Address

// Multiple RPC URLs for rate limit handling
const BASE_RPC_URLS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  process.env.NEXT_PUBLIC_BASE_RPC_URL_BACKUP || 'https://base.llamarpc.com',
  'https://base.drpc.org', // Additional public RPC
  'https://1rpc.io/base',   // Another public RPC
]

interface RegistrationState {
  status: 'idle' | 'checking' | 'registering' | 'success' | 'error'
  message: string
  txHash?: string
}

// RPC failover utility for contract operations

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
      console.log(`🔄 Trying RPC ${i + 1}/${BASE_RPC_URLS.length}: ${BASE_RPC_URLS[i]}`)
      
      const client = createPublicClient({
        chain: base,
        transport: http(BASE_RPC_URLS[i]),
      })
      
      const result = await operation(client)
      console.log(`✅ RPC ${i + 1} succeeded`)
      return result
    } catch (error) {
      console.log(`❌ RPC ${i + 1} failed:`, error instanceof Error ? error.message : error)
      
      // If this is the last attempt, throw the error
      if (i === Math.min(maxRetries, BASE_RPC_URLS.length) - 1) {
        throw error
      }
      
      // Wait a bit before trying next RPC
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  throw new Error('All RPC endpoints failed')
}

export default function Dashboard() {
  const router = useRouter()
  const { ready, authenticated, login, user, logout } = usePrivy()
  const { isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { needsTwitterConnection } = useTwitterConnection()
  
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
  
  // View records states
  const [viewRecordsUsername, setViewRecordsUsername] = useState('')
  const [viewRecordsLoading, setViewRecordsLoading] = useState(false)
  const [viewRecordsData, setViewRecordsData] = useState<{ [key: string]: string } | null>(null)
  const [viewRecordsError, setViewRecordsError] = useState<string | null>(null)
  
  // Update records states
  const [updateUsername, setUpdateUsername] = useState('')
  const [updateKey, setUpdateKey] = useState('')
  const [updateValue, setUpdateValue] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateResult, setUpdateResult] = useState<string | null>(null)
  
  // Real ENS availability check
  useEffect(() => {
    if (!username || username.length < 3 || !publicClient) {
      setIsAvailable(null)
      return
    }
    
    const timer = setTimeout(async () => {
      setRegistrationState({ status: 'checking', message: 'Checking availability...' })
      
      try {
        console.log(`🔍 Checking availability for ${username}.contx.eth...`)
        
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
          
        } catch (contractError) {
          // If contract call fails (username doesn't exist), it's available
          console.log(`📋 Contract call failed (username likely doesn't exist): ${contractError}`)
          available = true
          existingAddress = '0x0000000000000000000000000000000000000000'
        }
        
        console.log(`📋 Username ${username}: ${available ? 'Available' : 'Taken'} (owner: ${existingAddress})`)
        
        setIsAvailable(available)
        setRegistrationState({
          status: 'idle',
          message: available ? `${username}.contx.eth is available!` : `${username}.contx.eth is taken`
        })
      } catch (error) {
        console.error('❌ Availability check error:', error)
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
      
      // Step 3: Mint ENS via ContxRegistry contract
      setRegistrationState({ status: 'registering', message: 'Preparing contract calls...' })
      
      if (!walletClient || !publicClient || !isConnected) {
        throw new Error('Wallet not connected')
      }
      
      console.log('🚀 Starting ENS registration process...')
      console.log('Registration data prepared:', registrationResult.registrationData)
      console.log('ENS records to set:', registrationResult.ensRecords)
      console.log('Contract addresses:', {
        registry: CONTX_REGISTRY_ADDRESS,
        resolver: CONTX_RESOLVER_ADDRESS
      })
      
      // Step 3a: Register the username via ContxRegistry
      const bio = registrationResult.ensRecords['bio'] || ''
      const displayName = registrationResult.ensRecords['name'] || username
      
      console.log('📋 Registration parameters:')
      console.log(`  Username: ${username}`)
      console.log(`  Display Name: ${displayName}`)
      console.log(`  Bio: ${bio}`)
      console.log(`  Wallet: ${user?.wallet?.address}`)
      
      // Check gas estimation first
      console.log('⛽ Estimating gas for registration...')
      try {
        const gasEstimate = await publicClient.estimateContractGas({
          address: CONTX_REGISTRY_ADDRESS,
          abi: CONTX_REGISTRY_ABI,
          functionName: 'register',
          args: [username, displayName, bio],
          account: user?.wallet?.address as Address
        })
        console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`)
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError)
        throw new Error(`Gas estimation failed: ${gasError}`)
      }
      
      setRegistrationState({ status: 'registering', message: 'Minting ENS name on Base...' })
      console.log(`📝 Calling ContxRegistry.register()...`)
      console.log(`📝 Contract call details:`)
      console.log(`   Address: ${CONTX_REGISTRY_ADDRESS}`)
      console.log(`   Function: register`)
      console.log(`   Args: [${username}, ${displayName}, ${bio}]`)
      
      const registerHash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'register',
        args: [username, displayName, bio]
      })
      
      console.log(`📤 Registration transaction sent: ${registerHash}`)
      console.log(`🔗 View on BaseScan: https://basescan.org/tx/${registerHash}`)
      setRegistrationState({ status: 'registering', message: `Transaction sent (${registerHash.slice(0, 10)}...), waiting for confirmation...` })
      
      const registerReceipt = await publicClient.waitForTransactionReceipt({ hash: registerHash })
      
      console.log('📋 Registration receipt:', {
        status: registerReceipt.status,
        blockNumber: registerReceipt.blockNumber?.toString(),
        gasUsed: registerReceipt.gasUsed?.toString(),
        transactionHash: registerReceipt.transactionHash,
        logs: registerReceipt.logs?.length || 0
      })
      
      if (registerReceipt.status !== 'success') {
        console.error(`❌ Registration failed with status: ${registerReceipt.status}`)
        throw new Error(`Registration transaction failed with status: ${registerReceipt.status}`)
      }
      
      console.log(`✅ Registration successful! Hash: ${registerHash}`)
      console.log(`✅ ENS name ${username}.contx.eth is now registered!`)
      
      // Step 3b: Set all AI context text records using updateFields (batch update)
      setRegistrationState({ status: 'registering', message: 'Setting AI context records...' })
      
      // Prepare all records for batch update
      const allRecords = Object.entries(registrationResult.ensRecords)
      const keys = allRecords.map(([key]) => key)
      const values = allRecords.map(([, value]) => String(value))
      
      console.log(`📝 Setting ${allRecords.length} text records using updateFields...`)
      console.log(`📋 Keys: ${keys.join(', ')}`)
      console.log(`📋 Values preview:`)
      keys.forEach((key, index) => {
        const value = values[index]
        const preview = value.length > 50 ? `${value.substring(0, 50)}...` : value
        console.log(`   ${key}: "${preview}"`)
      })
      
      let successfulRecords = 0
      let failedRecords = 0
      
      try {
        // Estimate gas for batch update
        console.log('⛽ Estimating gas for updateFields...')
        console.log(`⛽ updateFields call details:`)
        console.log(`   Address: ${CONTX_REGISTRY_ADDRESS}`)
        console.log(`   Function: updateFields`)
        console.log(`   Username: ${username}`)
        console.log(`   Keys array length: ${keys.length}`)
        console.log(`   Values array length: ${values.length}`)
        
        const textGasEstimate = await publicClient.estimateContractGas({
          address: CONTX_REGISTRY_ADDRESS,
          abi: CONTX_REGISTRY_ABI,
          functionName: 'updateFields',
          args: [username, keys, values],
          account: user?.wallet?.address as Address
        })
        console.log(`⛽ Gas estimate for updateFields: ${textGasEstimate.toString()}`)
        
        // Execute batch text record update
        console.log(`📤 Calling updateFields with ${keys.length} records...`)
        setRegistrationState({ status: 'registering', message: `Setting ${keys.length} AI context records...` })
        
        const textHash = await walletClient.writeContract({
          address: CONTX_REGISTRY_ADDRESS,
          abi: CONTX_REGISTRY_ABI,
          functionName: 'updateFields',
          args: [username, keys, values]
        })
        
        console.log(`📤 updateFields transaction sent: ${textHash}`)
        console.log(`🔗 View on BaseScan: https://basescan.org/tx/${textHash}`)
        setRegistrationState({ status: 'registering', message: `AI records transaction sent (${textHash.slice(0, 10)}...), waiting for confirmation...` })
        
        const textReceipt = await publicClient.waitForTransactionReceipt({ hash: textHash })
        
        console.log('📋 updateFields receipt:', {
          status: textReceipt.status,
          blockNumber: textReceipt.blockNumber?.toString(),
          gasUsed: textReceipt.gasUsed?.toString(),
          transactionHash: textReceipt.transactionHash,
          logs: textReceipt.logs?.length || 0
        })
        
        if (textReceipt.status === 'success') {
          console.log(`✅ Successfully set all ${keys.length} records (gas used: ${textReceipt.gasUsed?.toString()})`)
          console.log(`✅ All AI context records are now stored on-chain!`)
          successfulRecords = keys.length
          failedRecords = 0
        } else {
          console.error(`❌ Failed to set text records - transaction failed with status: ${textReceipt.status}`)
          successfulRecords = 0
          failedRecords = keys.length
        }
        
      } catch (error) {
        console.error(`❌ Failed to update text records:`, error)
        console.error(`❌ Error details:`, {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
        successfulRecords = 0
        failedRecords = keys.length
      }
      
      console.log(`📊 Text records summary: ${successfulRecords} successful, ${failedRecords} failed`)
      
      // Verification step: Check what was actually stored
      if (successfulRecords > 0) {
        console.log('🔍 Verifying stored records...')
        try {
          // Try to read back some of the contract fields we just set
          const testKeys = ['name', 'bio', 'lore', 'topics', 'style']
          for (const key of testKeys) {
            try {
              const storedValue = await publicClient.readContract({
                address: CONTX_REGISTRY_ADDRESS,
                abi: CONTX_REGISTRY_ABI,
                functionName: 'getText',
                args: [username, key]
              })
              console.log(`✅ Verification - ${key}: ${storedValue ? 'STORED' : 'EMPTY'} (length: ${storedValue?.length || 0})`)
            } catch {
              console.log(`❌ Verification - ${key}: FAILED to read back`)
            }
          }
        } catch (error) {
          console.log('⚠️ Verification failed:', error)
        }
      }
      
      // Update status message based on results
      const recordsMessage = failedRecords > 0 ? 
        ` (${successfulRecords}/${allRecords.length} text records set)` : 
        ' with all AI context!'
      
      setRegistrationState({
        status: 'success',
        message: `Successfully registered ${username}.contx.eth${recordsMessage}`,
        txHash: registerHash
      })
      
      console.log(`🎉 Registration complete! Main transaction: ${registerHash}`)
      
    } catch (error) {
      console.error('Registration error:', error)
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
  
  // View text records function
  const handleViewRecords = async () => {
    if (!viewRecordsUsername || !publicClient) return
    
    setViewRecordsLoading(true)
    setViewRecordsError(null)
    setViewRecordsData(null)
    
    try {
      console.log(`🔍 Fetching records for ${viewRecordsUsername}.contx.eth...`)
      
      // First check if the username exists
      let userExists = false
      try {
        const address = await publicClient.readContract({
          address: CONTX_REGISTRY_ADDRESS,
          abi: CONTX_REGISTRY_ABI,
          functionName: 'getAddress',
          args: [viewRecordsUsername]
        })
        userExists = address !== '0x0000000000000000000000000000000000000000'
        console.log(`📋 Username ${viewRecordsUsername} exists: ${userExists} (address: ${address})`)
      } catch {
        console.log(`📋 Username ${viewRecordsUsername} does not exist`)
        userExists = false
      }
      
      if (!userExists) {
        setViewRecordsError(`${viewRecordsUsername}.contx.eth is not registered`)
        return
      }
      
      // First, let's see what getFieldNames actually returns
      console.log('🔍 Testing what getFieldNames actually returns...')
      try {
        const contractFieldNames = await publicClient.readContract({
          address: CONTX_REGISTRY_ADDRESS,
          abi: CONTX_REGISTRY_ABI,
          functionName: 'getFieldNames',
          args: [viewRecordsUsername]
        })
        console.log(`📋 getFieldNames() returned ${contractFieldNames.length} fields:`)
        contractFieldNames.forEach((field, index) => {
          console.log(`   ${index + 1}. "${field}"`)
        })
        console.log(`📋 Full array: [${contractFieldNames.map(f => `"${f}"`).join(', ')}]`)
      } catch (error) {
        console.log('❌ getFieldNames() failed:', error)
      }
      
      // ALWAYS check all possible fields (don't rely on getFieldNames hardcoded list)
      console.log('🔍 Now checking all possible field names individually...')
      
      // Check all possible fields that could exist
      const allPossibleFields = [
        // Contract's hardcoded fields (what getFieldNames returns)
        'name', 'bio', 'lore', 'messageExamples', 'postExamples', 'adjectives', 'topics', 'style', 'knowledge', 'avatar', 'description',
        // AI-generated fields that we store via updateFields
        'ai.bio', 'ai.style', 'ai.topics', 'ai.traits', 'ai.updated', 'ai.version',
        // Additional metadata fields
        'keywords', 'x.twitter', 'x.processed', 'x.version'
      ]
      
      console.log(`📋 Checking ${allPossibleFields.length} possible field names...`)
      
      // Check each field individually using RPC failover to avoid rate limits
      const existingFields: string[] = []
      for (const field of allPossibleFields) {
        try {
          const value = await tryMultipleRPCs(async (client) => {
            return await client.readContract({
              address: CONTX_REGISTRY_ADDRESS,
              abi: CONTX_REGISTRY_ABI,
              functionName: 'getText',
              args: [viewRecordsUsername, field]
            })
          })
          
          if (value && value.length > 0) {
            existingFields.push(field)
            console.log(`✅ Found field: ${field} (${value.length} chars)`)
          }
        } catch {
          // Field doesn't exist or is empty, skip it
          console.log(`⚠️ Field ${field} failed or empty`)
        }
      }
      
      const fieldNames = existingFields
      console.log(`📋 Total existing fields found: ${fieldNames.length}`)
      console.log(`📋 Field names: ${fieldNames.join(', ')}`)
      
      if (fieldNames.length === 0) {
        setViewRecordsData({})
        return
      }
      
      // Get values for all fields using RPC failover
      let fieldValues: string[]
      
      try {
        // Try batch getFields first with RPC failover
        const batchResults = await tryMultipleRPCs(async (client) => {
          return await client.readContract({
            address: CONTX_REGISTRY_ADDRESS,
            abi: CONTX_REGISTRY_ABI,
            functionName: 'getFields',
            args: [viewRecordsUsername, fieldNames]
          })
        })
        fieldValues = Array.from(batchResults)
        console.log(`📋 Retrieved ${fieldValues.length} field values via getFields`)
      } catch {
        console.log('⚠️ getFields failed, getting values individually...')
        
        // Fallback: Get each field value individually with RPC failover
        fieldValues = []
        for (const fieldName of fieldNames) {
          try {
            const value = await tryMultipleRPCs(async (client) => {
              return await client.readContract({
                address: CONTX_REGISTRY_ADDRESS,
                abi: CONTX_REGISTRY_ABI,
                functionName: 'getText',
                args: [viewRecordsUsername, fieldName]
              })
            })
            fieldValues.push(value || '')
          } catch {
            fieldValues.push('')
          }
        }
        console.log(`📋 Retrieved ${fieldValues.length} field values individually`)
      }
      
      // Combine field names and values
      const records: { [key: string]: string } = {}
      fieldNames.forEach((name, index) => {
        records[name] = fieldValues[index] || ''
      })
      
      console.log(`✅ Successfully retrieved records for ${viewRecordsUsername}:`, records)
      setViewRecordsData(records)
      
    } catch (error) {
      console.error('❌ Error fetching records:', error)
      setViewRecordsError(error instanceof Error ? error.message : 'Failed to fetch records')
    } finally {
      setViewRecordsLoading(false)
    }
  }
  
  // Update single field function
  const handleUpdateField = async () => {
    if (!updateUsername || !updateKey || !walletClient || !publicClient) return
    
    setUpdateLoading(true)
    setUpdateResult(null)
    
    try {
      console.log(`🔧 Updating field for ${updateUsername}.contx.eth...`)
      console.log(`🔧 Field: ${updateKey} = ${updateValue}`)
      
      // First check if username exists
      try {
        const address = await publicClient.readContract({
          address: CONTX_REGISTRY_ADDRESS,
          abi: CONTX_REGISTRY_ABI,
          functionName: 'getAddress',
          args: [updateUsername]
        })
        const userExists = address !== '0x0000000000000000000000000000000000000000'
        if (!userExists) {
          setUpdateResult(`❌ ${updateUsername}.contx.eth is not registered`)
          return
        }
        console.log(`📋 Username ${updateUsername} exists (address: ${address})`)
      } catch {
        setUpdateResult(`❌ ${updateUsername}.contx.eth is not registered`)
        return
      }
      
      // Update the field using updateFields (batch with single item)
      console.log('📤 Calling updateFields...')
      const updateHash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'updateFields',
        args: [updateUsername, [updateKey], [updateValue]]
      })
      
      console.log(`📤 Update transaction sent: ${updateHash}`)
      
      const updateReceipt = await publicClient.waitForTransactionReceipt({ hash: updateHash })
      
      if (updateReceipt.status === 'success') {
        console.log(`✅ Field updated successfully!`)
        
        // Verify the update
        try {
          const newValue = await publicClient.readContract({
            address: CONTX_REGISTRY_ADDRESS,
            abi: CONTX_REGISTRY_ABI,
            functionName: 'getText',
            args: [updateUsername, updateKey]
          })
          console.log(`✅ Verification: ${updateKey} = ${newValue}`)
          setUpdateResult(`✅ Successfully updated ${updateKey} for ${updateUsername}.contx.eth`)
        } catch {
          console.log('⚠️ Could not verify update')
          setUpdateResult(`✅ Update transaction successful: ${updateHash}`)
        }
      } else {
        console.error(`❌ Update failed with status: ${updateReceipt.status}`)
        setUpdateResult(`❌ Update failed`)
      }
      
    } catch (error) {
      console.error('❌ Error updating field:', error)
      setUpdateResult(`❌ Error: ${error instanceof Error ? error.message : 'Update failed'}`)
    } finally {
      setUpdateLoading(false)
    }
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
        <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20">
          <div className="mb-10 mt-4 md:mt-6">
            <div className="px-2">
              <div className="relative mx-auto h-full max-w-2xl border border-primary/20 p-8 rounded-2xl [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)]">
                <button
                  onClick={() => router.push('/')}
                  className="absolute top-6 left-6 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </button>
                
                <div className="pt-8">
                  <h1 className="text-4xl font-semibold mb-4">Connect Your Wallet</h1>
                  <p className="text-muted-foreground mb-8">Get started with your AI-enhanced ENS identity</p>
                  
                  <InteractiveHoverButton 
                    text="Connect Wallet"
                    onClick={login}
                    className="text-lg"
                  />
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

  // Success state
  if (registrationState.status === 'success') {
    return (
      <section className="relative overflow-hidden min-h-screen">
        <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20">
          <div className="mb-10 mt-4 md:mt-6">
            <div className="px-2">
              <div className="relative mx-auto h-full max-w-2xl border border-primary/20 p-8 rounded-2xl [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)]">
                <button
                  onClick={() => router.push('/')}
                  className="absolute top-6 left-6 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </button>
                
                {/* Top Right Account Info */}
                <div className="absolute top-6 right-6 z-30">
                  <div className="flex items-center gap-2">
                    {twitterUsername && (
                      <div className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-full">
                        <AtSign className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700 font-medium">{twitterUsername}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={logout}
                      className="flex items-center gap-1 px-3 py-2 text-xs bg-background/50 hover:bg-background/80 border border-primary/20 rounded-full transition-colors"
                    >
                      <LogOut className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                
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
                      className="text-sm px-6 py-3"
                    />
                    <button
                      onClick={() => router.push('/')}
                      className="px-6 py-3 text-sm border border-primary/20 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      Go Home
                    </button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          
          <div className="flex items-center gap-2">
            {twitterUsername && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-full">
                <AtSign className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">{twitterUsername}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 border border-primary/20 rounded-full">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-primary">
                {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
              </span>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-2 text-xs bg-background/50 hover:bg-background/80 border border-primary/20 rounded-full transition-colors"
            >
              <LogOut className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Main Registration Interface */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Claim Your Identity
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Create an AI-enhanced ENS name on Base
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by your connected Twitter account (@{twitterUsername}) and blockchain technology
            </p>
          </motion.div>

          {/* Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm border border-primary/10 rounded-3xl p-8 shadow-xl"
          >
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
              <button
                onClick={handleRegister}
                disabled={!username || !isAvailable || registrationState.status === 'registering'}
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] disabled:hover:scale-100"
              >
                {registrationState.status === 'registering' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Register {username && `${username}.contx.eth`}
                  </div>
                )}
              </button>
              
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

          {/* View Records Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm border border-primary/10 rounded-3xl p-8 shadow-xl mt-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-center">View ENS Records</h2>
            
            {/* Username Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter username to view records
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={viewRecordsUsername}
                  onChange={(e) => setViewRecordsUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="Enter username (e.g., aaronj)"
                  className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  disabled={viewRecordsLoading}
                />
              </div>
              
              {/* Domain Preview */}
              {viewRecordsUsername && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-center"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    <Globe className="w-4 h-4" />
                    {viewRecordsUsername}.contx.eth
                  </span>
                </motion.div>
              )}
            </div>

            {/* View Records Button */}
            <button
              onClick={handleViewRecords}
              disabled={!viewRecordsUsername || viewRecordsLoading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] disabled:hover:scale-100 mb-6"
            >
              {viewRecordsLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading Records...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" />
                  View Records
                </div>
              )}
            </button>

            {/* Error Message */}
            {viewRecordsError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {viewRecordsError}
                </div>
              </motion.div>
            )}

            {/* Records Display */}
            {viewRecordsData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-700">
                    Found {Object.keys(viewRecordsData).length} records for {viewRecordsUsername}.contx.eth
                  </span>
                </div>

                {Object.keys(viewRecordsData).length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
                    This name is registered but has no text records set.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {Object.entries(viewRecordsData).map(([key, value]) => {
                      // Format field labels
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
                        'description': 'Description'
                      }
                      
                      const label = fieldLabels[key] || key
                      
                      // Try to parse JSON values for better display
                      let displayValue = value
                      try {
                        const parsed = JSON.parse(value)
                        if (Array.isArray(parsed)) {
                          displayValue = parsed.join(', ')
                        } else if (typeof parsed === 'object') {
                          displayValue = JSON.stringify(parsed, null, 2)
                        }
                      } catch {
                        // Not JSON, use as-is
                      }
                      
                      // Special icons for different field types
                      const getFieldIcon = (fieldKey: string) => {
                        if (['messageExamples', 'postExamples'].includes(fieldKey)) return '💬'
                        if (['topics', 'knowledge'].includes(fieldKey)) return '🎯'
                        if (['adjectives', 'style'].includes(fieldKey)) return '✨'
                        if (fieldKey === 'lore') return '📖'
                        if (fieldKey === 'avatar') return '🖼️'
                        return '📝'
                      }
                      
                      return (
                        <div key={key} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm">{getFieldIcon(key)}</span>
                                <div className="font-medium text-gray-900 text-sm">{label}</div>
                              </div>
                              <div className="text-gray-600 text-sm break-all whitespace-pre-wrap">
                                {displayValue || <span className="italic text-gray-400">(empty)</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Update Fields Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm border border-primary/10 rounded-3xl p-8 shadow-xl mt-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-center">Update ENS Records</h2>
            
            {/* Form */}
            <div className="space-y-6">
              {/* Username Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Username to update
                </label>
                <input
                  type="text"
                  value={updateUsername}
                  onChange={(e) => setUpdateUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="Enter username (e.g., erewhonn)"
                  className="block w-full px-4 py-3 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  disabled={updateLoading}
                />
                {updateUsername && (
                  <div className="mt-2 text-sm text-gray-500">
                    Updating: {updateUsername}.contx.eth
                  </div>
                )}
              </div>

              {/* Field Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Field name
                </label>
                <select
                  value={updateKey}
                  onChange={(e) => setUpdateKey(e.target.value)}
                  className="block w-full px-4 py-3 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  disabled={updateLoading}
                >
                  <option value="">Select field to update</option>
                  <optgroup label="AI Fields">
                    <option value="ai.bio">ai.bio</option>
                    <option value="ai.style">ai.style</option>
                    <option value="ai.topics">ai.topics</option>
                    <option value="ai.traits">ai.traits</option>
                    <option value="ai.updated">ai.updated</option>
                    <option value="ai.version">ai.version</option>
                  </optgroup>
                  <optgroup label="Basic Fields">
                    <option value="name">name</option>
                    <option value="bio">bio</option>
                    <option value="description">description</option>
                    <option value="avatar">avatar</option>
                    <option value="keywords">keywords</option>
                  </optgroup>
                  <optgroup label="Extended Fields">
                    <option value="lore">lore</option>
                    <option value="messageExamples">messageExamples</option>
                    <option value="postExamples">postExamples</option>
                    <option value="adjectives">adjectives</option>
                    <option value="topics">topics</option>
                    <option value="style">style</option>
                    <option value="knowledge">knowledge</option>
                  </optgroup>
                  <optgroup label="Metadata">
                    <option value="x.twitter">x.twitter</option>
                    <option value="x.processed">x.processed</option>
                    <option value="x.version">x.version</option>
                  </optgroup>
                  <optgroup label="Custom">
                    <option value="custom">Custom field name...</option>
                  </optgroup>
                </select>
                
                {updateKey === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom field name"
                    onChange={(e) => setUpdateKey(e.target.value)}
                    className="block w-full px-4 py-3 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all mt-3"
                    disabled={updateLoading}
                  />
                )}
              </div>

              {/* Field Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Field value
                </label>
                <textarea
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  placeholder="Enter the value for this field"
                  rows={4}
                  className="block w-full px-4 py-3 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                  disabled={updateLoading}
                />
                <div className="mt-2 text-sm text-gray-500">
                  {updateValue.length} characters
                </div>
              </div>

              {/* Update Button */}
              <button
                onClick={handleUpdateField}
                disabled={!updateUsername || !updateKey || updateLoading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] disabled:hover:scale-100"
              >
                {updateLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating Field...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Update Field
                  </div>
                )}
              </button>

              {/* Result Message */}
              {updateResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl text-sm ${
                    updateResult.startsWith('✅') 
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {updateResult}
                </motion.div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}