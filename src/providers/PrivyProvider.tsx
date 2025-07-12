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
  // Use a placeholder app ID during build time
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'placeholder-for-build'
  
  // Skip rendering during build if no real app ID
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
            // Include coinbase_wallet in the wallet list
            walletList: ['coinbase_wallet', 'metamask'],
          },
          embeddedWallets: {
            createOnLogin: 'all-users', // Creates embedded wallets for everyone
          },
          defaultChain: base,
          supportedChains: [base],
          loginMethods: ['twitter', 'email'], // Social logins create embedded → smart wallets
          
          // REMOVED externalWallets config - this was causing the confusion
          // The smart wallets are created via dashboard config, not external connections
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </Privy>
    </QueryClientProvider>
  )
}