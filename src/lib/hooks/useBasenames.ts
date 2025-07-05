import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { createPublicClient, http, Address, keccak256, encodePacked } from 'viem'
import { baseSepolia } from 'viem/chains'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

const RESOLVER_ADDRESS = '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA' as const

const RESOLVER_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

function namehashHelper(name: string): `0x${string}` {
  if (name === '') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000'
  }
  
  const labels = name.split('.')
  let hash = '0x0000000000000000000000000000000000000000000000000000000000000000'
  
  for (let i = labels.length - 1; i >= 0; i--) {
    const label = labels[i]
    const labelHash = keccak256(new TextEncoder().encode(label))
    hash = keccak256(encodePacked(['bytes32', 'bytes32'], [hash as `0x${string}`, labelHash]))
  }
  
  return hash as `0x${string}`
}

function convertReverseNodeToBytes(address: Address, chainId: number) {
  const addressFormatted = address.toLowerCase() as Address
  const addressNode = keccak256(addressFormatted.substring(2) as Address)
  
  const cointype = (0x80000000 | chainId) >>> 0
  const chainCoinType = cointype.toString(16).toUpperCase()
  
  const baseReverseNode = namehashHelper(`${chainCoinType}.reverse`)
  const addressReverseNode = keccak256(
    encodePacked(['bytes32', 'bytes32'], [baseReverseNode, addressNode])
  )
  
  return addressReverseNode
}

export function useBasenames(address: Address | undefined) {
  const [basenames, setBasenames] = useState<string[]>([])
  const [reverseRecord, setReverseRecord] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (address) {
      checkReverseRecord(address)
    }
  }, [address])

  const checkReverseRecord = async (userAddress: Address) => {
    setIsLoading(true)
    
    try {
      // Check reverse record using Base's specific node
      const actualNode = '0x0FFD3408A81D4259101E43BF041112EC29078054DAAC8F3F1D3B6C9812E717C9' as `0x${string}`
      
      try {
        const reverseName = await publicClient.readContract({
          address: RESOLVER_ADDRESS,
          abi: RESOLVER_ABI,
          functionName: 'name',
          args: [actualNode],
        })
        
        if (reverseName && reverseName.includes('.basetest.eth')) {
          setReverseRecord(reverseName)
          setBasenames([reverseName])
        }
      } catch (error) {
        console.log('No reverse record found')
      }

      // Also check standard reverse node calculation
      try {
        const reverseNode = convertReverseNodeToBytes(userAddress, baseSepolia.id)
        const standardReverseName = await publicClient.readContract({
          address: RESOLVER_ADDRESS,
          abi: RESOLVER_ABI,
          functionName: 'name',
          args: [reverseNode],
        })
        
        if (standardReverseName && standardReverseName.includes('.basetest.eth')) {
          setReverseRecord(standardReverseName)
          if (!basenames.includes(standardReverseName)) {
            setBasenames(prev => [...prev, standardReverseName])
          }
        }
      } catch (error) {
        console.log('No standard reverse record found')
      }
    } catch (error) {
      console.error('Error checking basenames:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    basenames,
    reverseRecord,
    isLoading,
    refetch: () => address && checkReverseRecord(address),
  }
}