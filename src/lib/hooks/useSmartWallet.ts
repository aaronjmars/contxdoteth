import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export function useSmartWallet() {
  const { user, authenticated } = usePrivy()

  useEffect(() => {
    if (!authenticated || !user) return

    // Check if we have an embedded wallet but no smart wallet
    const embeddedWallet = user.linkedAccounts?.find(account => account.type === 'wallet')
    const smartWallet = user.linkedAccounts?.find(account => 
      account.type === 'smart_wallet'
    )

    console.log('🔍 Smart Wallet Check:')
    console.log('  Embedded wallet:', embeddedWallet)
    console.log('  Smart wallet:', smartWallet)
    console.log('  All linked accounts:', user.linkedAccounts)

    if (embeddedWallet && !smartWallet) {
      console.log('⚠️ Embedded wallet exists but no smart wallet found')
      console.log('💡 Smart wallets should be created automatically if configured in Privy Dashboard')
      
      // Log all account types to debug
      const accountTypes = user.linkedAccounts?.map(acc => acc.type) || []
      console.log('📊 Account types found:', accountTypes)
    }
  }, [user, authenticated])

  const smartWallet = user?.linkedAccounts?.find(account => 
    account.type === 'smart_wallet'
  )

  return {
    hasSmartWallet: !!smartWallet,
    smartWallet,
    smartWalletAddress: smartWallet?.address
  }
}