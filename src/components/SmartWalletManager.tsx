'use client'

import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { usePrivySmartWallet } from '@/lib/hooks/usePrivySmartWallet'

export default function SmartWalletManager() {
  const { user, authenticated, createWallet } = usePrivy()
  const smartWallets = usePrivySmartWallet()
  
  console.log('🔧 SmartWalletManager - smartWallets:', smartWallets)

  useEffect(() => {
    const checkAndCreateSmartWallet = async () => {
      if (!authenticated || !user) return

      // Check if user has an embedded wallet but no smart wallet
      const embeddedWallet = user.linkedAccounts?.find(account => account.type === 'wallet')
      const smartWallet = user.linkedAccounts?.find(account => 
        account.type === 'smart_wallet'
      )

      console.log('🔄 Smart Wallet Manager Check:')
      console.log('  User authenticated:', authenticated)
      console.log('  Embedded wallet:', embeddedWallet?.address)
      console.log('  Smart wallet:', smartWallet?.address)

      if (embeddedWallet && !smartWallet && createWallet) {
        console.log('🚀 Attempting to create smart wallet...')
        try {
          // Some versions of Privy require explicit wallet creation
          // This is a fallback if smart wallets aren't created automatically
          const wallet = await createWallet()
          console.log('✅ Wallet creation response:', wallet)
        } catch (error) {
          console.log('❌ Smart wallet creation error:', error)
          console.log('💡 This might be normal if smart wallets are created automatically')
        }
      }

      // Additional debugging for account types
      const accountTypes = user.linkedAccounts?.map(acc => ({
        type: acc.type,
        address: (acc as unknown as { address?: string }).address,
        walletClientType: (acc as unknown as { walletClientType?: string }).walletClientType
      }))
      console.log('📊 All account details:', accountTypes)
    }

    checkAndCreateSmartWallet()
  }, [user, authenticated, createWallet])

  return null // This is a logic-only component
}