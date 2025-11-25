import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import SupportModal from "@/components/support-modal"
import AuthProvider from "@/components/auth-provider"

export const metadata: Metadata = {
  title: "BioDash by Biogen",
  description: "Gestor Operacional de Biodigestores",
  generator: "Biogen",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AuthProvider>
          {children}
          <SupportModal />
        </AuthProvider>
      </body>
    </html>
  )
}
