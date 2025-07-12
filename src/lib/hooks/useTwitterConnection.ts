import { usePrivy } from '@privy-io/react-auth'

export function useTwitterConnection() {
  const { user, ready, authenticated } = usePrivy()
  
  const hasTwitterConnected = user?.linkedAccounts?.some(account => account.type === 'twitter_oauth')
  const hasEmbeddedWallet = user?.linkedAccounts?.some(account => account.type === 'wallet') || user?.wallet
  
  return {
    hasTwitterConnected: hasTwitterConnected || false,
    hasEmbeddedWallet: hasEmbeddedWallet || false,
    isReady: ready,
    isAuthenticated: authenticated,
    needsTwitterConnection: authenticated && !hasTwitterConnected,
    linkedAccounts: user?.linkedAccounts || []
  }
}