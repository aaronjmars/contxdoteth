import './globals.css'
import { Inter } from 'next/font/google'
import { PrivyProvider } from '@/providers/PrivyProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Context.eth - AI-Enhanced ENS Profiles',
  description: 'Transform your X profile into an AI-aware .base.eth identity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  )
}