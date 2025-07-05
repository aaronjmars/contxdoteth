import { useState, useEffect } from 'react'
import { Address } from 'viem'
import { resolveENSName } from '../ens'

export function useENSName(address: Address | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasResolved, setHasResolved] = useState(false)

  useEffect(() => {
    if (!address) {
      setEnsName(null)
      setHasResolved(false)
      return
    }

    setIsLoading(true)
    setHasResolved(false)
    
    resolveENSName(address)
      .then(name => {
        setEnsName(name)
        setHasResolved(true)
      })
      .catch(error => {
        console.error('Failed to resolve ENS name:', error)
        setEnsName(null)
        setHasResolved(true)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [address])

  // Helper function to get display name with fallback
  const getDisplayName = (fallbackAddress?: string) => {
    if (isLoading) return 'Loading...'
    if (ensName) return ensName
    if (!hasResolved) return 'Loading...'
    if (fallbackAddress) return `${fallbackAddress.slice(0, 6)}...${fallbackAddress.slice(-4)}`
    return 'Not connected'
  }

  return { ensName, isLoading, hasResolved, getDisplayName }
}