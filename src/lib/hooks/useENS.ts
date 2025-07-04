import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { encodeFunctionData } from 'viem'
import {
  BASE_ENS_ADDRESSES,
  ENS_RESOLVER_ABI,
  BASE_REGISTRAR_ABI,
  namehash,
  isValidBasename,
  formatBasename,
  formatAIContextForENS,
  type AIContextRecord,
} from '../ens'

export interface RegistrationOptions {
  name: string
  aiContext: {
    bio?: string[]
    topics?: string[]
    traits?: string[]
    style?: { all?: string[] }
  }
  duration?: number // in seconds, default 1 year
}

export interface RegistrationStatus {
  isLoading: boolean
  isAvailable: boolean | null
  price: bigint | null
  error: string | null
}

export function useENS() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>({
    isLoading: false,
    isAvailable: null,
    price: null,
    error: null,
  })

  const checkAvailability = useCallback(async (name: string) => {
    if (!publicClient || !isValidBasename(name)) {
      setRegistrationStatus(prev => ({ ...prev, isAvailable: false, error: 'Invalid name' }))
      return false
    }

    setRegistrationStatus(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const formattedName = formatBasename(name)
      
      const available = await publicClient.readContract({
        address: BASE_ENS_ADDRESSES.registrar,
        abi: BASE_REGISTRAR_ABI,
        functionName: 'available',
        args: [formattedName],
      })

      setRegistrationStatus(prev => ({ 
        ...prev, 
        isAvailable: available as boolean,
        isLoading: false 
      }))

      return available as boolean
    } catch (error) {
      console.error('Error checking availability:', error)
      setRegistrationStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check availability',
        isAvailable: false,
      }))
      return false
    }
  }, [publicClient])

  const getRegistrationPrice = useCallback(async (name: string, duration = 365 * 24 * 60 * 60) => {
    if (!publicClient || !isValidBasename(name)) return null

    try {
      const formattedName = formatBasename(name)
      
      const priceData = await publicClient.readContract({
        address: BASE_ENS_ADDRESSES.registrar,
        abi: BASE_REGISTRAR_ABI,
        functionName: 'rentPrice',
        args: [formattedName, BigInt(duration)],
      }) as { base: bigint; premium: bigint }

      const totalPrice = priceData.base + priceData.premium
      
      setRegistrationStatus(prev => ({ ...prev, price: totalPrice }))
      return totalPrice
    } catch (error) {
      console.error('Error getting price:', error)
      return null
    }
  }, [publicClient])

  const registerBasename = useCallback(async (options: RegistrationOptions) => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected')
    }

    const { name, aiContext, duration = 365 * 24 * 60 * 60 } = options
    const formattedName = formatBasename(name)

    if (!isValidBasename(formattedName)) {
      throw new Error('Invalid basename')
    }

    setRegistrationStatus(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check availability first
      const available = await checkAvailability(formattedName)
      if (!available) {
        throw new Error('Name not available')
      }

      // Get price
      const price = await getRegistrationPrice(formattedName, duration)
      if (!price) {
        throw new Error('Could not determine price')
      }

      // Format AI context for ENS text records
      const ensRecords = formatAIContextForENS(aiContext)
      
      // Prepare resolver data for setting text records
      const resolverData: `0x${string}`[] = []
      const node = namehash(`${formattedName}.base.eth`)
      
      for (const [key, value] of Object.entries(ensRecords)) {
        const setTextData = encodeFunctionData({
          abi: ENS_RESOLVER_ABI,
          functionName: 'setText',
          args: [node, key, value],
        })
        resolverData.push(setTextData)
      }

      // Generate a simple secret (in production, use proper randomness)
      const secret = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as `0x${string}`

      // Register the name with AI context
      const hash = await walletClient.writeContract({
        address: BASE_ENS_ADDRESSES.registrar,
        abi: BASE_REGISTRAR_ABI,
        functionName: 'register',
        args: [
          formattedName,
          address,
          BigInt(duration),
          secret,
          BASE_ENS_ADDRESSES.resolver,
          resolverData,
          true, // reverseRecord
          0, // fuses
          BigInt(0), // wrapperExpiry
        ],
        value: price,
      })

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      setRegistrationStatus(prev => ({ ...prev, isLoading: false }))
      
      return {
        success: true,
        transactionHash: hash,
        baseName: `${formattedName}.base.eth`,
        receipt,
      }
    } catch (error) {
      console.error('Registration error:', error)
      setRegistrationStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }))
      throw error
    }
  }, [walletClient, address, publicClient, checkAvailability, getRegistrationPrice])

  const updateAIContext = useCallback(async (baseName: string, aiContext: RegistrationOptions['aiContext']) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      const node = namehash(baseName)
      const ensRecords = formatAIContextForENS(aiContext)
      
      // Prepare batch update
      const keys = Object.keys(ensRecords)

      const hash = await walletClient.writeContract({
        address: BASE_ENS_ADDRESSES.resolver,
        abi: ENS_RESOLVER_ABI,
        functionName: 'multicall',
        args: [
          keys.map(key => encodeFunctionData({
            abi: ENS_RESOLVER_ABI,
            functionName: 'setText',
            args: [node, key, ensRecords[key as keyof AIContextRecord]],
          }))
        ],
      })

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }

      return { success: true, transactionHash: hash }
    } catch (error) {
      console.error('Update AI context error:', error)
      throw error
    }
  }, [walletClient, address, publicClient])

  const readAIContext = useCallback(async (baseName: string) => {
    if (!publicClient) return null

    try {
      const node = namehash(baseName)
      const keys = ['ai.bio', 'ai.style', 'ai.topics', 'ai.traits', 'ai.updated', 'ai.version']
      
      const records: Record<string, string> = {}
      
      for (const key of keys) {
        try {
          const value = await publicClient.readContract({
            address: BASE_ENS_ADDRESSES.resolver,
            abi: ENS_RESOLVER_ABI,
            functionName: 'text',
            args: [node, key],
          })
          records[key] = value as string
        } catch (error) {
          console.warn(`Failed to read ${key}:`, error)
          records[key] = ''
        }
      }

      return records
    } catch (error) {
      console.error('Error reading AI context:', error)
      return null
    }
  }, [publicClient])

  return {
    registrationStatus,
    checkAvailability,
    getRegistrationPrice,
    registerBasename,
    updateAIContext,
    readAIContext,
    isValidBasename,
    formatBasename,
  }
}