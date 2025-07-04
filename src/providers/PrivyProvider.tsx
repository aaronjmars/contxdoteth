'use client'

import { PrivyProvider as Privy } from '@privy-io/react-auth'
import { base } from 'viem/chains'

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Privy
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#3b82f6',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: base,
        supportedChains: [base],
        loginMethods: ['wallet', 'email', 'twitter'],
      }}
    >
      {children}
    </Privy>
  )
}