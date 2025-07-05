'use client'

import { useAccount } from 'wagmi'
import { useBasenames } from '@/lib/hooks/useBasenames'
import { CheckCircle, Hexagon, RefreshCw, AlertCircle } from 'lucide-react'

export default function BasenamesList() {
  const { address } = useAccount()
  const { basenames, reverseRecord, isLoading, refetch } = useBasenames(address)

  if (!address) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Your Basenames</h3>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          title="Refresh basenames"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-muted">Checking basenames...</span>
        </div>
      ) : basenames.length > 0 ? (
        <div className="space-y-3">
          {basenames.map((basename, index) => (
            <div key={index} className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <Hexagon className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{basename}</p>
                  {reverseRecord === basename && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span className="text-xs text-success">Primary reverse record</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {reverseRecord && (
            <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">Reverse Resolution Active</p>
                  <p className="text-xs text-success/80">
                    Your address resolves to {reverseRecord}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-muted mb-1">No basenames found</p>
          <p className="text-sm text-muted">
            Register your first .basetest.eth name to get started
          </p>
        </div>
      )}
    </div>
  )
}