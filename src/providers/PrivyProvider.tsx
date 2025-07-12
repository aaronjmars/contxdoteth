'use client'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'

export function SimpleDebugComponent() {
  const { user, authenticated, ready } = usePrivy()
  const [logs, setLogs] = useState<string[]>([])

  // Log function to track events
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(`🔍 ${logMessage}`)
    setLogs(prev => [...prev, logMessage])
  }

  // Monitor user and smart wallet state
  useEffect(() => {
    if (!ready) return

    if (authenticated && user) {
      // Find different wallet types
      const embeddedWallet = user.linkedAccounts.find(acc => acc.type === 'wallet')
      const smartWallet = user.linkedAccounts.find(acc => acc.type === 'smart_wallet')
      
      addLog(`User authenticated with ${user.linkedAccounts.length} linked accounts`)
      
      if (embeddedWallet) {
        addLog(`✅ Embedded wallet found: ${embeddedWallet.address}`)
      }
      
      if (smartWallet) {
        addLog(`✅ Smart wallet found: ${smartWallet.address}`)
        addLog(`Smart wallet type: ${smartWallet.smartWalletType || 'unknown'}`)
      } else {
        addLog(`⚠️ No smart wallet found yet - may still be creating...`)
      }
    }
  }, [ready, authenticated, user])

  // Get wallet info for display
  const embeddedWallet = user?.linkedAccounts.find(acc => acc.type === 'wallet')
  const smartWallet = user?.linkedAccounts.find(acc => acc.type === 'smart_wallet')

  if (!ready) {
    return <div className="p-4 border rounded-lg">🔄 Loading Privy...</div>
  }

  if (!authenticated) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="font-bold mb-2">Smart Wallet Debug</h3>
        <p>Please log in to see smart wallet information</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Wallet Information */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-bold mb-3 text-lg">🔧 Smart Wallet Debug Panel</h3>
        
        <div className="space-y-2 text-sm">
          <div>
            <strong>User ID:</strong> {user?.id}
          </div>
          
          {embeddedWallet && (
            <div>
              <strong>📱 Embedded Wallet:</strong> 
              <code className="ml-2 bg-gray-100 px-1 rounded text-xs">
                {embeddedWallet.address}
              </code>
            </div>
          )}
          
          {smartWallet ? (
            <div className="space-y-1">
              <div>
                <strong>🚀 Smart Wallet:</strong> 
                <code className="ml-2 bg-green-100 px-1 rounded text-xs">
                  {smartWallet.address}
                </code>
              </div>
              <div>
                <strong>Type:</strong> {smartWallet.smartWalletType || 'Unknown'}
              </div>
              <div className="text-green-600 font-medium">
                ✅ Gas sponsorship should be active for this wallet!
              </div>
            </div>
          ) : (
            <div className="text-yellow-600">
              ⚠️ Smart wallet not found - check Privy Dashboard configuration
            </div>
          )}
        </div>
      </div>

      {/* Configuration Status */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-bold mb-2">📊 Configuration Status</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span>{user ? '✅' : '❌'}</span>
            <span>User authenticated</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>{embeddedWallet ? '✅' : '❌'}</span>
            <span>Embedded wallet created</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>{smartWallet ? '✅' : '❌'}</span>
            <span>Smart wallet created</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔧</span>
            <span>Gas sponsorship (configure in Privy Dashboard)</span>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-bold mb-2">📋 Debug Logs</h4>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <div>No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
        
        <button
          onClick={() => setLogs([])}
          className="mt-2 text-sm bg-gray-500 text-white px-2 py-1 rounded"
        >
          Clear Logs
        </button>
      </div>

      {/* Configuration Instructions */}
      <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
        <h4 className="font-bold mb-2 text-blue-800">📋 Alchemy Setup Required</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>1.</strong> Go to your Privy Dashboard → Smart wallets</p>
          <p><strong>2.</strong> Enable smart wallets and select a wallet type (e.g., Kernel)</p>
          <p><strong>3.</strong> Configure Base network with:</p>
          <ul className="ml-4 space-y-1">
            <li>• <strong>Paymaster URL:</strong> Your Alchemy paymaster URL</li>
            <li>• <strong>Gas Policy ID:</strong> Your Alchemy gas policy ID</li>
            <li>• <strong>Bundler URL:</strong> Your Alchemy bundler URL (optional)</li>
          </ul>
          <p><strong>4.</strong> Once configured, all transactions from the smart wallet will be sponsored!</p>
        </div>
      </div>

      {/* Next Steps */}
      {smartWallet && (
        <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
          <h4 className="font-bold mb-2 text-green-800">🎉 Smart Wallet Ready!</h4>
          <div className="text-sm text-green-700">
            <p>Your smart wallet is created. To test gas sponsorship:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Configure Alchemy paymaster in Privy Dashboard</li>
              <li>Try sending a transaction using regular wallet methods</li>
              <li>The transaction should execute without charging gas fees!</li>
            </ol>
            <p className="mt-2 font-medium">
              Optional: Install <code className="bg-green-200 px-1 rounded">permissionless</code> package for advanced smart wallet features.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}