'use client'

import { useState } from 'react'
import { useENS } from '@/lib/hooks/useENS'
import { Settings, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface SetTextRecordsProps {
  baseName?: string
  aiContext?: {
    bio?: string[]
    topics?: string[]
    traits?: string[]
    style?: { all?: string[] }
  }
}

export default function SetTextRecords({ baseName: initialBaseName, aiContext: initialContext }: SetTextRecordsProps) {
  const [baseName, setBaseName] = useState(initialBaseName || '')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  const { updateAIContext, formatBasename } = useENS()

  // Mock AI context for testing
  const defaultContext = {
    bio: ["Builder, crypto enthusiast, and AI researcher", "Based in San Francisco, CA"],
    topics: ["web3", "ai", "development", "community", "design", "ens"],
    traits: ["builder", "optimistic", "collaborative", "influential"],
    style: { all: ["expressive", "technical"] }
  }

  const aiContext = initialContext || defaultContext

  const handleSetRecords = async () => {
    if (!baseName.trim()) return

    setIsLoading(true)
    setResults(null)

    try {
      const formattedName = formatBasename(baseName)
      const fullName = formattedName.endsWith('.basetest.eth') ? formattedName : `${formattedName}.basetest.eth`
      
      console.log('Manually setting text records for:', fullName)
      
      await updateAIContext(fullName, aiContext)
      
      setResults({
        success: 6, // All 6 AI context fields
        failed: 0,
        errors: []
      })
    } catch (error) {
      console.error('Failed to set text records:', error)
      setResults({
        success: 0,
        failed: 6,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <Settings className="w-6 h-6 mr-3 text-primary" />
        Set AI Text Records
      </h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="label">Basename (without .basetest.eth)</label>
          <input
            type="text"
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            placeholder="dzjduz"
            className="input"
            disabled={isLoading}
          />
        </div>

        {/* AI Context Preview */}
        <div className="bg-secondary p-4 rounded-xl">
          <h3 className="font-semibold mb-3">AI Context to Set</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Bio:</strong> {aiContext.bio?.length || 0} entries</div>
            <div><strong>Topics:</strong> {aiContext.topics?.join(', ') || 'None'}</div>
            <div><strong>Traits:</strong> {aiContext.traits?.join(', ') || 'None'}</div>
            <div><strong>Style:</strong> {aiContext.style?.all?.join(', ') || 'None'}</div>
          </div>
        </div>

        <button
          onClick={handleSetRecords}
          disabled={isLoading || !baseName.trim()}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting Text Records...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Set AI Context Records
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {results.success > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-xl p-4">
              <div className="flex items-center text-success">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Successfully set {results.success} text records!</span>
              </div>
            </div>
          )}

          {results.failed > 0 && (
            <div className="bg-error/10 border border-error/20 rounded-xl p-4">
              <div className="flex items-start text-error">
                <XCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <div>Failed to set {results.failed} text records</div>
                  {results.errors.map((error, i) => (
                    <div key={i} className="text-sm mt-1 opacity-80">{error}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-muted">
              Go to <a href="/verify" className="text-primary hover:underline">/verify</a> to check if records were set successfully
            </p>
          </div>
        </div>
      )}
    </div>
  )
}