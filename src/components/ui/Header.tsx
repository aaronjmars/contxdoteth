'use client'

import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { AnimatedLogo } from "@/components/ui/animated-logo"

export default function Header() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()

  const handleClaim = () => {
    if (authenticated) {
      router.push('/dashboard')
    } else {
      login()
    }
  }

  return (
    <header className="fixed top-4 left-0 right-0 z-50">
      <div className="w-full px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Animated Logo */}
          <div className="flex-shrink-0">
            <AnimatedLogo />
          </div>

          {/* Right: Claim Button */}
          <div className="flex-shrink-0">
            <InteractiveHoverButton 
              text={authenticated ? 'Dashboard' : 'Mint'}
              onClick={handleClaim}
              disabled={!ready}
              className="bg-primary text-primary-foreground border-primary text-sm px-6 py-2"
            />
          </div>
        </div>
      </div>
    </header>
  )
}