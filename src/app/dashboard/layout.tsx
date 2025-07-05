'use client'

import Layout from '@/components/ui/Layout'

export default function DashboardNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>
}