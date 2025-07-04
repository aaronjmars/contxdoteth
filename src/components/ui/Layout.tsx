'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { authenticated, user, login, logout } = usePrivy()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isAuthenticated={authenticated}
        user={user}
        onLogin={login}
        onLogout={logout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}