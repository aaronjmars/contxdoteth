'use client'

import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}