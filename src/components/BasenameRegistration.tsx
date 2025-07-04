'use client'

import { useState, useEffect } from 'react'
import { useENS } from '@/lib/hooks/useENS'
import { formatEther } from 'viem'
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Hexagon,
  Sparkles,
  DollarSign,
} from 'lucide-react'

interface BasenameRegistrationProps {
  aiContext: {
    bio?: string[]
    topics?: string[]
    traits?: string[]
    style?: { all?: string[] }
  }
  onSuccess: (baseName: string, transactionHash: string) => void
}

export default function BasenameRegistration({ aiContext, onSuccess }: BasenameRegistrationProps) {
  const [desiredName, setDesiredName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  
  const {
    registrationStatus,
    checkAvailability,
    getRegistrationPrice,
    registerBasename,
    isValidBasename,
    formatBasename,
  } = useENS()

  const handleNameChange = (name: string) => {
    const formatted = formatBasename(name)
    setDesiredName(formatted)
  }

  const handleCheckAvailability = async () => {
    if (!desiredName || !isValidBasename(desiredName)) return
    setCheckingAvailability(true)
    await checkAvailability(desiredName)
    await getRegistrationPrice(desiredName)
    setCheckingAvailability(false)
  }

  const handleRegister = async () => {
    if (!desiredName || !aiContext || !registrationStatus.isAvailable) return

    setIsRegistering(true)
    try {
      const result = await registerBasename({
        name: desiredName,
        aiContext,
        duration: 365 * 24 * 60 * 60, // 1 year
      })

      if (result.success) {
        onSuccess(result.baseName, result.transactionHash)
      }
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsRegistering(false)
    }
  }

  // Auto-check availability when name changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (desiredName && isValidBasename(desiredName) && desiredName.length >= 3) {
        handleCheckAvailability()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [desiredName, handleCheckAvailability, isValidBasename])

  const isNameValid = desiredName && isValidBasename(desiredName) && desiredName.length >= 3

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <Hexagon className="w-6 h-6 text-primary mr-3" />
        <h2 className="text-2xl font-semibold">Create Your .base.eth Profile</h2>
      </div>

      <div className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="label">Choose your basename</label>
          <div className="relative">
            <input
              type="text"
              value={desiredName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="yourname"
              className="input pr-32"
              maxLength={63}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted text-sm">
              .base.eth
            </div>
          </div>
          
          {/* Validation Messages */}
          <div className="mt-2 space-y-1">
            {desiredName && !isNameValid && (
              <p className="text-sm text-error flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Name must be 3+ characters, lowercase letters, numbers, and hyphens only
              </p>
            )}
            
            {isNameValid && (
              <div className="flex items-center space-x-4">
                {/* Availability Status */}
                {checkingAvailability || registrationStatus.isLoading ? (
                  <div className="flex items-center text-sm text-muted">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking availability...
                  </div>
                ) : registrationStatus.isAvailable === true ? (
                  <div className="flex items-center text-sm text-success">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Available
                  </div>
                ) : registrationStatus.isAvailable === false ? (
                  <div className="flex items-center text-sm text-error">
                    <XCircle className="w-4 h-4 mr-2" />
                    Not available
                  </div>
                ) : null}

                {/* Price Display */}
                {registrationStatus.price && (
                  <div className="flex items-center text-sm text-muted">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {parseFloat(formatEther(registrationStatus.price)).toFixed(4)} ETH/year
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Context Preview */}
        <div className="bg-secondary p-4 rounded-xl">
          <h3 className="font-semibold mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            AI Context to be stored
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Bio lines:</span> {aiContext?.bio?.length || 0}
            </div>
            <div>
              <span className="font-medium">Topics:</span> {aiContext?.topics?.length || 0}
            </div>
            <div>
              <span className="font-medium">Traits:</span> {aiContext?.traits?.length || 0}
            </div>
            <div>
              <span className="font-medium">Communication style:</span> {aiContext?.style?.all?.length || 0} preferences
            </div>
          </div>
        </div>

        {/* Registration Button */}
        <div className="pt-4">
          {registrationStatus.isAvailable && registrationStatus.price ? (
            <button
              onClick={handleRegister}
              disabled={isRegistering || !isNameValid}
              className="btn-primary w-full text-lg py-4"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registering {desiredName}.base.eth...
                </>
              ) : (
                <>
                  Register {desiredName}.base.eth
                  <span className="ml-2 text-sm opacity-75">
                    ({parseFloat(formatEther(registrationStatus.price)).toFixed(4)} ETH)
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleCheckAvailability}
              disabled={!isNameValid || checkingAvailability}
              className="btn-secondary w-full text-lg py-4"
            >
              {checkingAvailability ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Availability'
              )}
            </button>
          )}
        </div>

        {/* Error Display */}
        {registrationStatus.error && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-error mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-error mb-1">Registration Error</h4>
                <p className="text-sm text-error/80">{registrationStatus.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-primary mb-1">What happens next?</h4>
              <ul className="text-sm text-primary/80 space-y-1">
                <li>• Your basename will be registered on Base L2</li>
                <li>• AI context will be stored in ENS text records</li>
                <li>• You will be able to update your context anytime</li>
                <li>• AI agents can read your profile for better interactions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}