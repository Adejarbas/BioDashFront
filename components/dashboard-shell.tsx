"use client"

import type React from "react"
import { Leaf } from "lucide-react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-green-50">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bio-header px-6">
        <a href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Leaf className="h-6 w-6" />
          <span className="text-xl">BioDash</span>
        </a>
        <nav className="ml-auto flex gap-6">
          <a href="/dashboard" className="text-sm font-medium text-white hover:text-green-100 transition-colors">
            Dashboard
          </a>
          <a href="/indicators" className="text-sm font-medium text-green-100 hover:text-white transition-colors">
            Indicadores
          </a>
          <a href="/settings" className="text-sm font-medium text-green-100 hover:text-white transition-colors">
            Configurações
          </a>
          <button
            onClick={() => {
              localStorage.removeItem("token")
              window.location.href = "/login"
            }}
            className="text-sm font-medium text-green-100 hover:text-white transition-colors"
          >
            Sair
          </button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>
      <footer className="py-4 px-8 text-center text-sm text-green-700 border-t border-green-100 bg-white">
        <p>© 2024 BioDash - Sistema de Monitoramento de Biodigestores</p>
      </footer>
    </div>
  )
}
