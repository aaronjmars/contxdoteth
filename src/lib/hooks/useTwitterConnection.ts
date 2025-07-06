import { usePrivy } from '@privy-io/react-auth'

export function useTwitterConnection() {
  const { user, ready, authenticated } = usePrivy()
  
  const hasTwitterConnected = user?.linkedAccounts?.some(account => account.type === 'twitter_oauth')
  const hasWalletConnected = user?.linkedAccounts?.some(account => account.type === 'wallet') || user?.wallet
  
  return {
    hasTwitterConnected: hasTwitterConnected || false,
    hasWalletConnected: hasWalletConnected || false,
    isReady: ready,
    isAuthenticated: authenticated,
    needsTwitterConnection: authenticated && !hasTwitterConnected && hasWalletConnected,
    linkedAccounts: user?.linkedAccounts || []
  }
}