'use client'

import React from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useSmartWalletDebug } from '@/lib/hooks/useSmartWalletDebug'

export default function SmartWalletDebug() {
  const { authenticated, ready } = usePrivy()
  const walletInfo = useSmartWalletDebug()

  if (!ready || !authenticated) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md text-xs">
        <h3 className="font-bold mb-2">🔍 Smart Wallet Debug</h3>
        <p>Not authenticated or ready</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md text-xs max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2">🔍 Smart Wallet Debug</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Smart Wallet Status:</strong>
          <span className={`ml-2 px-2 py-1 rounded ${walletInfo.hasSmartWallet ? 'bg-green-600' : 'bg-red-600'}`}>
            {walletInfo.hasSmartWallet ? '✅ Active' : '❌ Not Found'}
          </span>
        </div>

        {walletInfo.smartWalletAddress && (
          <div>
            <strong>Smart Wallet Address:</strong>
            <div className="font-mono text-xs break-all bg-gray-800 p-1 rounded mt-1">
              {walletInfo.smartWalletAddress}
            </div>
          </div>
        )}

        {walletInfo.embeddedWalletAddress && (
          <div>
            <strong>Embedded Wallet Address:</strong>
            <div className="font-mono text-xs break-all bg-gray-800 p-1 rounded mt-1">
              {walletInfo.embeddedWalletAddress}
            </div>
          </div>
        )}

        <div>
          <strong>Linked Accounts ({walletInfo.linkedAccounts.length}):</strong>
          <div className="mt-1 space-y-1">
            {walletInfo.linkedAccounts.map((account, index) => {
              const acc = account as { type?: string; address?: string; username?: string; walletClientType?: string }
              return (
                <div key={index} className="bg-gray-800 p-2 rounded text-xs">
                  <div><strong>Type:</strong> {acc.type || 'unknown'}</div>
                  {acc.address && <div><strong>Address:</strong> {acc.address}</div>}
                  {acc.username && <div><strong>Username:</strong> {acc.username}</div>}
                  {acc.walletClientType && <div><strong>Client:</strong> {acc.walletClientType}</div>}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <strong>Environment:</strong>
          <div className="mt-1 text-xs">
            <div>Bundler: {process.env.NEXT_PUBLIC_ALCHEMY_BUNDLER_URL ? '✅' : '❌'}</div>
            <div>Paymaster: {process.env.NEXT_PUBLIC_ALCHEMY_PAYMASTER_URL ? '✅' : '❌'}</div>
            <div>Gas Policy: {process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID ? '✅' : '❌'}</div>
          </div>
        </div>

        {!walletInfo.hasSmartWallet && (
          <div className="bg-yellow-900/50 p-2 rounded text-xs">
            <strong>⚠️ Smart Wallet Setup Required:</strong>
            <div className="mt-1 text-xs">
              1. Go to Privy Dashboard → Smart wallets<br/>
              2. Enable smart wallets<br/>
              3. Select &quot;Light Account&quot; wallet type<br/>
              4. Configure Base network with Alchemy URLs<br/>
              5. Enter your Alchemy gas policy ID from environment
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400">
          Open browser console for detailed transaction logs
        </div>
      </div>
    </div>
  )
}