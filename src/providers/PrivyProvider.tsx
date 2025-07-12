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
            // Add coinbase_wallet to show it as option
            walletList: ['coinbase_wallet', 'metamask'], 
          },
          embeddedWallets: {
            createOnLogin: 'all-users',
          },
          defaultChain: base,
          supportedChains: [base],
          loginMethods: ['twitter', 'email'], // Social logins create embedded → smart wallets
          
          // REMOVE THIS ENTIRE SECTION:
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