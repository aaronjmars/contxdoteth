import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface SmartWalletInfo {
  hasSmartWallet: boolean
  smartWalletAddress?: string
  embeddedWalletAddress?: string
  linkedAccounts: unknown[]
  privyUser: unknown
}

export function useSmartWalletDebug() {
  const { user, authenticated, ready } = usePrivy()
  const [walletInfo, setWalletInfo] = useState<SmartWalletInfo>({
    hasSmartWallet: false,
    linkedAccounts: [],
    privyUser: null
  })

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      console.log('🔍 Smart Wallet Debug: Not ready, authenticated, or no user')
      return
    }

    console.log('🔍 Smart Wallet Debug: Starting analysis...')
    console.log('📱 User object:', JSON.stringify(user, null, 2))
    
    // Check for smart wallet in linked accounts
    const smartWallet = user.linkedAccounts?.find(account => account.type === 'smart_wallet')
    const embeddedWallet = user.linkedAccounts?.find(account => account.type === 'wallet') || user.wallet
    
    console.log('🔗 Linked Accounts:', user.linkedAccounts)
    console.log('🧠 Smart Wallet Found:', smartWallet)
    console.log('💎 Embedded Wallet Found:', embeddedWallet)
    
    if (smartWallet) {
      console.log('✅ Smart Wallet Address:', smartWallet.address)
      console.log('🏗️ Smart Wallet Type:', (smartWallet as unknown as { walletClientType?: string }).walletClientType || 'Unknown')
      console.log('⛓️ Smart Wallet Chain:', (smartWallet as unknown as { chainId?: string }).chainId || 'Unknown')
    } else {
      console.log('❌ No Smart Wallet found in linked accounts')
    }

    if (embeddedWallet) {
      console.log('✅ Embedded Wallet Address:', embeddedWallet.address)
      console.log('🔑 Embedded Wallet Type:', (embeddedWallet as unknown as { walletClientType?: string }).walletClientType || 'Unknown')
    } else {
      console.log('❌ No Embedded Wallet found')
    }

    // Check environment variables
    console.log('🌍 Environment Variables:')
    console.log('  Bundler URL:', process.env.NEXT_PUBLIC_ALCHEMY_BUNDLER_URL)
    console.log('  Paymaster URL:', process.env.NEXT_PUBLIC_ALCHEMY_PAYMASTER_URL)
    console.log('  Gas Policy ID:', process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID)

    setWalletInfo({
      hasSmartWallet: !!smartWallet,
      smartWalletAddress: smartWallet?.address,
      embeddedWalletAddress: embeddedWallet?.address,
      linkedAccounts: user.linkedAccounts || [],
      privyUser: user
    })

  }, [user, authenticated, ready])

  return walletInfo
}