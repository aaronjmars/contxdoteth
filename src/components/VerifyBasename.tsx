'use client'

import { useState } from 'react'
import { useENS } from '@/lib/hooks/useENS'
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyBasename() {
  const [basename, setBasename] = useState('')
  const [verification, setVerification] = useState<{
    isLoading: boolean
    exists: boolean | null
    hasTextRecords: boolean | null
    records: Record<string, string> | null
    error: string | null
  }>({
    isLoading: false,
    exists: null,
    hasTextRecords: null,
    records: null,
    error: null,
  })

  const { readAIContext, verifyTextRecords, formatBasename } = useENS()

  const handleVerify = async () => {
    if (!basename.trim()) return

    const formattedName = formatBasename(basename)
    const fullName = `${formattedName}.basetest.eth`

    setVerification({ 
      isLoading: true, 
      exists: null, 
      hasTextRecords: null, 
      records: null,
      error: null 
    })

    try {
      // Check if text records exist
      const records = await readAIContext(fullName)
      const hasRecords = await verifyTextRecords(fullName)

      setVerification({
        isLoading: false,
        exists: true, // If we can read records, the name exists
        hasTextRecords: hasRecords,
        records,
        error: null,
      })
    } catch (error) {
      console.error('Verification error:', error)
      setVerification({
        isLoading: false,
        exists: false,
        hasTextRecords: false,
        records: null,
        error: error instanceof Error ? error.message : 'Verification failed',
      })
    }
  }

  const parseRecord = (value: string) => {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Verify Basename Registration</h2>
      
      {/* Input */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="label">Enter basename to verify</label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={basename}
                onChange={(e) => setBasename(e.target.value)}
                placeholder="yourname"
                className="input pr-32"
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted text-sm">
                .basetest.eth
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={verification.isLoading || !basename.trim()}
              className="btn-primary"
            >
              {verification.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {verification.error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 mb-6">
          <div className="flex items-center text-error">
            <XCircle className="w-5 h-5 mr-2" />
            <span>Error: {verification.error}</span>
          </div>
        </div>
      )}

      {verification.exists !== null && !verification.error && (
        <div className="space-y-4">
          {/* Registration Status */}
          <div className="flex items-center space-x-3">
            {verification.exists ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-error" />
            )}
            <span className="font-medium">
              {verification.exists ? 'Basename is registered' : 'Basename not found'}
            </span>
          </div>

          {/* Text Records Status */}
          {verification.exists && (
            <div className="flex items-center space-x-3">
              {verification.hasTextRecords ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-warning" />
              )}
              <span className="font-medium">
                {verification.hasTextRecords ? 'AI context records found' : 'No AI context records'}
              </span>
            </div>
          )}

          {/* Records Details */}
          {verification.records && (
            <div className="bg-secondary p-4 rounded-xl">
              <h3 className="font-semibold mb-3">AI Context Records</h3>
              <div className="space-y-3">
                {Object.entries(verification.records).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-sm font-medium text-muted">{key}</div>
                    <div className="text-sm bg-background p-2 rounded border">
                      {value ? (
                        <pre className="whitespace-pre-wrap text-xs">
                          {typeof parseRecord(value) === 'object' 
                            ? JSON.stringify(parseRecord(value), null, 2)
                            : value
                          }
                        </pre>
                      ) : (
                        <span className="text-muted italic">No data</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}