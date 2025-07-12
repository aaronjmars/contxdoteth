'use client'

import { PrivyProvider as Privy } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { base } from 'viem/chains'
import { http } from 'viem'
import { createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
  ssr: true,
})

const queryClient = new QueryClient()

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'placeholder-for-build'
  
  if (typeof window === 'undefined' && appId === 'placeholder-for-build') {
    return <>{children}</>
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <Privy
        appId={appId}
        config={{
          appearance: {
            theme: 'light',
            accentColor: '#0071e3',
            logo: 'https://files.readme.io/a0c0c4f-privy-logo-black.svg',
            // Add this to show Coinbase in wallet list if needed
            walletList: ['coinbase_wallet'], 
          },
          embeddedWallets: {
            createOnLogin: 'all-users', // ✅ This creates embedded wallets
          },
          defaultChain: base,
          supportedChains: [base],
          
          // Focus on social logins to get embedded wallets
          loginMethods: ['twitter', 'email'], // ✅ Removed 'wallet' to avoid external confusion
          
          // Remove this entire section for now
          // externalWallets: {
          //   coinbaseWallet: {
          //     connectionOptions: 'smartWalletOnly',
          //   },
          // },
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </Privy>
    </QueryClientProvider>
  )
}