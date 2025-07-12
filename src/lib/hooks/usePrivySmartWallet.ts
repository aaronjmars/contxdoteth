import { useSmartWallets } from '@privy-io/react-auth/smart-wallets'
import { useEffect } from 'react'

export function usePrivySmartWallet() {
  const smartWallets = useSmartWallets()
  
  useEffect(() => {
    if (smartWallets) {
      console.log('🎯 Smart Wallets Hook Status:')
      console.log('  Client:', smartWallets.client)
      console.log('  Client available:', !!smartWallets.client) 
      console.log('  Full object:', smartWallets)
    }
  }, [smartWallets])

  return smartWallets
}