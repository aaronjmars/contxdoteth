'use client'
import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets'
import { base } from 'viem/chains'
import { parseEther } from 'viem'
import { useEffect, useState } from 'react'

export function SmartWalletDebugComponent() {
  const { user, authenticated, ready } = usePrivy()
  const { client } = useSmartWallets()
  const [logs, setLogs] = useState<string[]>([])
  const [isTransacting, setIsTransacting] = useState(false)

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

      if (client) {
        addLog(`✅ Smart wallet client is ready`)
        addLog(`Smart wallet client address: ${client.account?.address}`)
      }
    }
  }, [ready, authenticated, user, client])

  // Test sponsored transaction
  const testSponsoredTransaction = async () => {
    if (!client || !user) {
      addLog('❌ Smart wallet client not available')
      return
    }

    setIsTransacting(true)
    addLog('🚀 Starting sponsored transaction test...')

    try {
      // Send a small sponsored transaction to yourself (no actual transfer)
      const smartWallet = user.linkedAccounts.find(acc => acc.type === 'smart_wallet')
      
      if (!smartWallet) {
        addLog('❌ No smart wallet address found')
        return
      }

      addLog(`📡 Sending sponsored transaction from smart wallet: ${smartWallet.address}`)
      
      const txHash = await client.sendTransaction({
        account: client.account,
        chain: base,
        to: smartWallet.address, // Send to self (no actual transfer)
        value: parseEther('0'), // 0 ETH
        data: '0x', // Empty data
      })
      
      addLog(`✅ Sponsored transaction successful!`)
      addLog(`Transaction hash: ${txHash}`)
      addLog(`🎉 Gas fees were paid by Alchemy paymaster!`)
      
    } catch (error: any) {
      addLog(`❌ Transaction failed: ${error.message}`)
      console.error('Transaction error:', error)
    } finally {
      setIsTransacting(false)
    }
  }

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
            </div>
          ) : (
            <div className="text-yellow-600">
              ⚠️ Smart wallet not found - check Privy Dashboard configuration
            </div>
          )}
          
          <div>
            <strong>Client Ready:</strong> {client ? '✅ Yes' : '❌ No'}
          </div>
        </div>
      </div>

      {/* Test Transaction */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-bold mb-2">🧪 Test Alchemy Gas Sponsorship</h4>
        <p className="text-sm text-gray-600 mb-3">
          Send a test transaction to verify gas sponsorship is working
        </p>
        
        <button
          onClick={testSponsoredTransaction}
          disabled={!client || !smartWallet || isTransacting}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isTransacting ? '🔄 Testing...' : '🚀 Test Sponsored Transaction'}
        </button>
        
        {!client && (
          <p className="text-red-600 text-sm mt-2">
            Smart wallet client not ready
          </p>
        )}
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
          <p><strong>4.</strong> Save configuration and test the transaction above</p>
        </div>
      </div>
    </div>
  )
}