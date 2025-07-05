'use client'

import { useRouter } from 'next/navigation'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useENSName } from '@/lib/hooks/useENSName'

interface HeaderProps {
  isAuthenticated: boolean
  user: {
    wallet?: { address?: string }
  } | null
  onLogin: () => void
  onLogout: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export default function Header({ 
  isAuthenticated, 
  user, 
  onLogin, 
  onLogout, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}: HeaderProps) {
  const router = useRouter()
  const { getDisplayName } = useENSName(user?.wallet?.address as `0x${string}`)

  const displayName = getDisplayName(user?.wallet?.address)

  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
            <img 
              src="/contxdoteth.png" 
              alt="contx.eth logo" 
              className="w-6 h-6"
            />
            <span className="text-xl font-semibold text-[#1d1d1f]">contx.eth</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => {
                const element = document.getElementById('features')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-muted hover:text-[#1d1d1f] transition-colors text-sm"
            >
              Features
            </button>
            <button 
              onClick={() => {
                const element = document.getElementById('how-it-works')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-muted hover:text-[#1d1d1f] transition-colors text-sm"
            >
              How it works
            </button>
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-[#1d1d1f] font-medium">
                    {displayName}
                  </span>
                </button>
                <button 
                  onClick={onLogout}
                  className="p-2 text-muted hover:text-[#1d1d1f] transition-colors rounded-full hover:bg-secondary"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onLogin}
                className="btn-primary text-sm"
              >
                Connect
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-[#1d1d1f]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-border/50">
          <div className="px-4 py-4 space-y-3">
            <button 
              onClick={() => {
                const element = document.getElementById('features')
                element?.scrollIntoView({ behavior: 'smooth' })
                setMobileMenuOpen(false)
              }}
              className="block text-muted hover:text-[#1d1d1f] py-2"
            >
              Features
            </button>
            <button 
              onClick={() => {
                const element = document.getElementById('how-it-works')
                element?.scrollIntoView({ behavior: 'smooth' })
                setMobileMenuOpen(false)
              }}
              className="block text-muted hover:text-[#1d1d1f] py-2"
            >
              How it works
            </button>
            {isAuthenticated ? (
              <div className="space-y-2 pt-4 border-t border-border/50">
                <button 
                  onClick={() => {
                    router.push('/dashboard')
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-3 text-[#1d1d1f] hover:bg-secondary rounded-xl transition-colors"
                >
                  Dashboard
                </button>
                <button 
                  onClick={onLogout}
                  className="block w-full text-left px-4 py-3 text-muted hover:bg-secondary rounded-xl transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-border/50">
                <button 
                  onClick={onLogin}
                  className="w-full btn-primary"
                >
                  Connect
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}