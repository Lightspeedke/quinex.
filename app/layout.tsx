import type React from "react"
import type { Metadata } from "next"
import { Sora } from "next/font/google"
import "./globals.css"
import MiniKitProvider from "@/components/minikit-provider"
import AuthProvider from "@/components/auth-provider"

const sora = Sora({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Quinex Token",
  description: "Quinex DeFi Platform - Stake, Vote, and Trade QIX Tokens",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={sora.className}>
        <AuthProvider>
          <MiniKitProvider>{children}</MiniKitProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
