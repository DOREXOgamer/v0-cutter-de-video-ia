"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function DashboardLayout({
  children,
  title,
  description,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header title={title} description={description} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
