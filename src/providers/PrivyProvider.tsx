'use client'

import { PrivyProvider as Privy } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { baseSepolia } from 'viem/chains'
import { http } from 'viem'
import { createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'),
  },
  ssr: true,
})

const queryClient = new QueryClient()

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Privy
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          appearance: {
            theme: 'light',
            accentColor: '#0071e3',
            logo: 'https://files.readme.io/a0c0c4f-privy-logo-black.svg',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
          defaultChain: baseSepolia,
          supportedChains: [baseSepolia],
          loginMethods: ['twitter', 'wallet'],
          externalWallets: {
            coinbaseWallet: {
              connectionOptions: 'smartWalletOnly',
            },
          },
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </Privy>
    </QueryClientProvider>
  )
}