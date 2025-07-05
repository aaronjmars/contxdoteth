import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { encodeFunctionData, namehash } from 'viem'
import {
  BASE_ENS_ADDRESSES,
  ENS_RESOLVER_ABI,
  REGISTRAR_CONTROLLER_ABI,
  BASE_REGISTRAR_NFT_ABI,
  ENS_REGISTRY_ABI,
  BASENAME_L2_RESOLVER_ADDRESS,
  basenameNodehash,
  nameToTokenId,
  isValidBasename,
  formatBasename,
  formatAIContextForENS,
  mainnetPublicClient,
  type AIContextRecord,
  type RegisterRequest,
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
        address: BASE_ENS_ADDRESSES.registrarController,
        abi: REGISTRAR_CONTROLLER_ABI,
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
      
      const price = await publicClient.readContract({
        address: BASE_ENS_ADDRESSES.registrarController,
        abi: REGISTRAR_CONTROLLER_ABI,
        functionName: 'registerPrice',
        args: [formattedName, BigInt(duration)],
      }) as bigint

      setRegistrationStatus(prev => ({ ...prev, price }))
      return price
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

    console.log('🧪 CLEAN START - DEBUGGING REGISTRATION')
    console.log('📋 INPUT DATA:')
    console.log('- Original name:', name)
    console.log('- Formatted name:', formattedName)
    console.log('- Duration:', duration)
    console.log('- User address:', address)
    console.log('- Chain ID:', publicClient.chain?.id)
    console.log('- Network:', publicClient.chain?.name)
    
    console.log('📋 CONTRACT ADDRESSES:')
    console.log('- RegistrarController:', BASE_ENS_ADDRESSES.registrarController)
    console.log('- Registry:', BASE_ENS_ADDRESSES.registry)
    console.log('- BaseRegistrar:', BASE_ENS_ADDRESSES.baseRegistrar)
    console.log('- L2Resolver:', BASENAME_L2_RESOLVER_ADDRESS)

    if (!isValidBasename(formattedName)) {
      throw new Error('Invalid basename')
    }

    setRegistrationStatus(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check availability
      console.log('🔍 Checking availability...')
      const available = await checkAvailability(formattedName)
      console.log('- Available:', available)
      if (!available) {
        throw new Error('Name not available')
      }

      // Get price
      console.log('💰 Getting price...')
      const price = await getRegistrationPrice(formattedName, duration)
      console.log('- Price:', price?.toString())
      if (!price) {
        throw new Error('Could not determine price')
      }

      // Prepare resolver data to set address during registration
      const node = namehash(`${formattedName}.basetest.eth`)
      console.log('📊 Setting address for node:', node)
      
      const setAddrData = encodeFunctionData({
        abi: ENS_RESOLVER_ABI,
        functionName: 'setAddr',
        args: [node, address],
      })
      
      console.log('📊 setAddr data:', setAddrData)

      // Create registration request
      const registerRequest = {
        name: formattedName,
        owner: address,
        duration: BigInt(duration),
        resolver: BASENAME_L2_RESOLVER_ADDRESS,
        data: [setAddrData], // Set address during registration
        reverseRecord: true,
      }
      
      console.log('📝 REGISTRATION REQUEST:')
      console.log('- Name:', registerRequest.name)
      console.log('- Owner:', registerRequest.owner)
      console.log('- Duration:', registerRequest.duration.toString())
      console.log('- Resolver:', registerRequest.resolver)
      console.log('- Data length:', registerRequest.data.length)
      console.log('- Reverse record:', registerRequest.reverseRecord)

      console.log('🚀 SENDING REGISTRATION TRANSACTION...')
      const hash = await walletClient.writeContract({
        address: BASE_ENS_ADDRESSES.registrarController,
        abi: REGISTRAR_CONTROLLER_ABI,
        functionName: 'register',
        args: [registerRequest],
        value: price,
      })
      
      console.log('📋 TRANSACTION SENT:')
      console.log('- Hash:', hash)
      console.log('- Check on BaseScan:', `https://sepolia.basescan.org/tx/${hash}`)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ TRANSACTION CONFIRMED:')
      console.log('- Block:', receipt.blockNumber?.toString())
      console.log('- Gas used:', receipt.gasUsed?.toString())
      console.log('- Status:', receipt.status)
      
      setRegistrationStatus(prev => ({ ...prev, isLoading: false }))
      
      return {
        success: true,
        transactionHash: hash,
        baseName: `${formattedName}.basetest.eth`,
        receipt,
        textRecordsSet: false,
        message: `✅ Registration complete! Check BaseScan: https://sepolia.basescan.org/tx/${hash}`
      }
    } catch (error) {
      console.error('❌ REGISTRATION ERROR:', error)
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

      const multicallData = keys.map(key => encodeFunctionData({
        abi: ENS_RESOLVER_ABI,
        functionName: 'setText',
        args: [node, key, ensRecords[key as keyof AIContextRecord]],
      }))

      const hash = await walletClient.writeContract({
        address: BASENAME_L2_RESOLVER_ADDRESS,
        abi: ENS_RESOLVER_ABI,
        functionName: 'multicall',
        args: [multicallData],
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
      
      console.log('Reading AI context for:', baseName)
      console.log('Node hash:', node)
      
      const records: Record<string, string> = {}
      
      for (const key of keys) {
        try {
          const value = await publicClient.readContract({
            address: BASENAME_L2_RESOLVER_ADDRESS,
            abi: ENS_RESOLVER_ABI,
            functionName: 'text',
            args: [node, key],
          })
          records[key] = value as string
          console.log(`Read ${key}:`, value)
        } catch (error) {
          console.warn(`Failed to read ${key}:`, error)
          records[key] = ''
        }
      }

      console.log('All records read:', records)
      return records
    } catch (error) {
      console.error('Error reading AI context:', error)
      return null
    }
  }, [publicClient])

  const verifyTextRecords = useCallback(async (baseName: string) => {
    const records = await readAIContext(baseName)
    if (!records) return false
    
    // Check if any meaningful records exist
    const hasRecords = Object.values(records).some(value => value && value.trim() !== '')
    console.log('Text records verification:', { baseName, hasRecords, records })
    return hasRecords
  }, [readAIContext])

  const getUserENSNames = useCallback(async () => {
    if (!address) return []
    
    try {
      // Get ENS names from mainnet
      const mainnetName = await mainnetPublicClient.getEnsName({ address })
      const names: string[] = []
      
      if (mainnetName) {
        names.push(mainnetName)
      }
      
      // TODO: In production, you would query Base ENS registry for .base.eth names
      // For now, we'll just return mainnet ENS names
      
      return names
    } catch (error) {
      console.error('Error fetching ENS names:', error)
      return []
    }
  }, [address])

  return {
    registrationStatus,
    checkAvailability,
    getRegistrationPrice,
    registerBasename,
    updateAIContext,
    readAIContext,
    verifyTextRecords,
    getUserENSNames,
    isValidBasename,
    formatBasename,
  }
}