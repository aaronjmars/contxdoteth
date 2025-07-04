'use client'

import { PrivyProvider as Privy } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { base } from 'viem/chains'
import { http } from 'viem'

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
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
        defaultChain: base,
        supportedChains: [base],
        loginMethods: ['twitter', 'wallet', 'email'],
        externalWallets: {
          coinbaseWallet: {
            connectionOptions: 'smartWalletOnly',
          },
        },
      }}
    >
      <WagmiProvider
        config={{
          chains: [base],
          transports: {
            [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
          },
        }}
      >
        {children}
      </WagmiProvider>
    </Privy>
  )
}