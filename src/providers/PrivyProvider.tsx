'use client'

import { PrivyProvider as Privy } from '@privy-io/react-auth'
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets'
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
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'users-without-wallets',
            },
            requireUserPasswordOnCreate: false,
          },
          defaultChain: base,
          supportedChains: [base],
          loginMethods: ['twitter'],
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          <SmartWalletsProvider
            config={{
              paymasterContext: {
                // Alchemy specific paymaster context if needed
                policyId: process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID,
              }
            }}
          >
            {children}
          </SmartWalletsProvider>
        </WagmiProvider>
      </Privy>
    </QueryClientProvider>
  )
}