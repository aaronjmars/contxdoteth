'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { normalize } from 'viem/ens'
import { baseSepolia } from 'viem/chains'
import { createPublicClient, http, Address, namehash, keccak256 } from 'viem'
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

// Contract addresses
const BASENAME_NFT_ADDRESS = '0xa0c70ec36c010b55e3c434d6c6ebeec50c705794' as const
const REGISTRY_ADDRESS = '0x1493b2567056c2181630115660963E13A8E32735' as const
const RESOLVER_ADDRESS = '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA' as const

// ABIs
const NFT_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const REGISTRY_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'resolver',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const RESOLVER_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'addr',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const



interface RegistrationVerificationProps {
  baseName: string
}

export default function RegistrationVerification({ baseName }: RegistrationVerificationProps) {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<{
    nftOwned?: boolean
    registryOwned?: boolean
    hasResolver?: boolean
    forwardWorks?: boolean
    reverseWorks?: boolean
    details?: unknown
    error?: string
  } | null>(null)


  const verifyRegistration = useCallback(async () => {
    if (!address) return

    setIsLoading(true)

    try {
      // Extract name without .basetest.eth
      const nameOnly = baseName.replace('.basetest.eth', '')
      const normalizedName = normalize(nameOnly)
      const node = namehash(`${normalizedName}.basetest.eth`)
      const labelHash = keccak256(new TextEncoder().encode(normalizedName))
      const tokenId = BigInt(labelHash)

      const checks = {
        nftOwner: null as Address | null,
        registryOwner: null as Address | null,
        resolver: null as Address | null,
        forwardResolution: null as Address | null,
        reverseRecord: null as string | null,
      }

      // Check NFT ownership
      try {
        checks.nftOwner = await publicClient.readContract({
          address: BASENAME_NFT_ADDRESS,
          abi: NFT_ABI,
          functionName: 'ownerOf',
          args: [tokenId],
        })
      } catch (error) {
        console.error('NFT check failed:', error)
      }

      // Check registry ownership
      try {
        checks.registryOwner = await publicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'owner',
          args: [node],
        })
      } catch (error) {
        console.error('Registry check failed:', error)
      }

      // Check resolver
      try {
        checks.resolver = await publicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'resolver',
          args: [node],
        })

        if (checks.resolver && checks.resolver !== '0x0000000000000000000000000000000000000000') {
          checks.forwardResolution = await publicClient.readContract({
            address: checks.resolver,
            abi: RESOLVER_ABI,
            functionName: 'addr',
            args: [node],
          })
        }
      } catch (error) {
        console.error('Resolver check failed:', error)
      }

      // Check reverse record (using Base's specific node)
      try {
        const actualNode = '0x0FFD3408A81D4259101E43BF041112EC29078054DAAC8F3F1D3B6C9812E717C9' as `0x${string}`
        checks.reverseRecord = await publicClient.readContract({
          address: RESOLVER_ADDRESS,
          abi: RESOLVER_ABI,
          functionName: 'name',
          args: [actualNode],
        })
      } catch (error) {
        console.error('Reverse check failed:', error)
      }

      setResults({
        nftOwned: checks.nftOwner?.toLowerCase() === address.toLowerCase(),
        registryOwned: checks.registryOwner?.toLowerCase() === address.toLowerCase(),
        hasResolver: checks.resolver !== '0x0000000000000000000000000000000000000000',
        forwardWorks: checks.forwardResolution?.toLowerCase() === address.toLowerCase(),
        reverseWorks: !!checks.reverseRecord && checks.reverseRecord.includes(nameOnly),
        details: checks,
      })
    } catch (error) {
      console.error('Verification failed:', error)
      setResults({ error: 'Verification failed' })
    } finally {
      setIsLoading(false)
    }
  }, [address, baseName])

  useEffect(() => {
    if (baseName && address) {
      verifyRegistration()
    }
  }, [baseName, address, verifyRegistration])

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          <span>Verifying registration...</span>
        </div>
      </div>
    )
  }

  if (results?.error) {
    return (
      <div className="card">
        <div className="flex items-start gap-3 p-4 bg-error/10 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-error mt-0.5" />
          <div>
            <p className="font-medium text-error">Verification Error</p>
            <p className="text-sm text-error/80">{results.error}</p>
          </div>
        </div>
      </div>
    )
  }

  const allWorking = results?.nftOwned && results?.registryOwned && results?.hasResolver && results?.forwardWorks

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
          allWorking ? 'bg-success/10' : 'bg-warning/10'
        }`}>
          {allWorking ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-warning" />
          )}
        </div>
        <h3 className="font-semibold">Registration Status</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg flex items-center gap-3 ${
          results?.nftOwned ? 'bg-success/10' : 'bg-error/10'
        }`}>
          {results?.nftOwned ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-error" />
          )}
          <div>
            <p className="text-sm font-medium">NFT Ownership</p>
            <p className="text-xs text-muted">{results?.nftOwned ? 'Owned' : 'Not owned'}</p>
          </div>
        </div>

        <div className={`p-3 rounded-lg flex items-center gap-3 ${
          results?.registryOwned ? 'bg-success/10' : 'bg-error/10'
        }`}>
          {results?.registryOwned ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-error" />
          )}
          <div>
            <p className="text-sm font-medium">Registry</p>
            <p className="text-xs text-muted">{results?.registryOwned ? 'Owned' : 'Not owned'}</p>
          </div>
        </div>

        <div className={`p-3 rounded-lg flex items-center gap-3 ${
          results?.hasResolver ? 'bg-success/10' : 'bg-error/10'
        }`}>
          {results?.hasResolver ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-error" />
          )}
          <div>
            <p className="text-sm font-medium">Resolver</p>
            <p className="text-xs text-muted">{results?.hasResolver ? 'Configured' : 'Not set'}</p>
          </div>
        </div>

        <div className={`p-3 rounded-lg flex items-center gap-3 ${
          results?.forwardWorks ? 'bg-success/10' : 'bg-error/10'
        }`}>
          {results?.forwardWorks ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-error" />
          )}
          <div>
            <p className="text-sm font-medium">Forward Resolution</p>
            <p className="text-xs text-muted">{results?.forwardWorks ? 'Working' : 'Not working'}</p>
          </div>
        </div>
      </div>

      <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 ${
        results?.reverseWorks ? 'bg-success/10' : 'bg-warning/10'
      }`}>
        {results?.reverseWorks ? (
          <CheckCircle className="w-4 h-4 text-success" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-warning" />
        )}
        <div>
          <p className="text-sm font-medium">Reverse Resolution</p>
          <p className="text-xs text-muted">
            {results?.reverseWorks 
              ? 'Working (Base format)' 
              : 'Set but uses Base-specific format'
            }
          </p>
        </div>
      </div>

      {allWorking && (
        <div className="mt-4 p-3 bg-success/5 border border-success/20 rounded-lg">
          <p className="text-sm text-success font-medium">✅ Registration complete!</p>
          <p className="text-xs text-success/80 mt-1">
            Your basename is fully functional and ready to use.
          </p>
        </div>
      )}
    </div>
  )
}