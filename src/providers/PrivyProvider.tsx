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
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'all-users',
    },
  },
  defaultChain: base,
  supportedChains: [base],
  loginMethods: ['twitter'],
}}
      >
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </Privy>
    </QueryClientProvider>
  )
}