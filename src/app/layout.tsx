import './globals.css'
import { Inter } from 'next/font/google'
import { PrivyProvider } from '@/providers/PrivyProvider'
import StyledComponentsRegistry from '@/lib/registry'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'contx.eth - AI-Enhanced ENS Profiles',
  description: 'Transform your X profile into an AI-aware .basetest.eth identity',
  icons: {
    icon: '/favicon-32x32.png',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <PrivyProvider>
            {children}
          </PrivyProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}