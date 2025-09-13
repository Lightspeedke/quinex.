"use client"

import { MiniKit } from "@worldcoin/minikit-js"
import { type ReactNode, useEffect, useState } from "react"

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeMiniKit = async () => {
      try {
        if (typeof window !== "undefined") {
          // Check if we're in World App environment
          const isWorldApp =
            typeof window !== "undefined" &&
            (window.location.hostname.includes("worldapp") ||
              window.navigator.userAgent.includes("WorldApp") ||
              // @ts-ignore - Check for World App specific properties
              window.WorldApp !== undefined)

          console.log("[v0] Environment check - Is World App:", isWorldApp)
          console.log("[v0] User Agent:", window.navigator.userAgent)
          console.log("[v0] Hostname:", window.location.hostname)

          if (isWorldApp || process.env.NODE_ENV === "development") {
            // Install MiniKit
            MiniKit.install()

            // Wait a bit for installation to complete
            await new Promise((resolve) => setTimeout(resolve, 100))

            const installed = MiniKit.isInstalled()
            console.log("[v0] MiniKit installation status:", installed)

            if (installed) {
              console.log("[v0] MiniKit initialized successfully")
            } else {
              console.log("[v0] MiniKit installation failed")
            }
          } else {
            console.log("[v0] Not in World App environment, MiniKit not available")
          }

          setIsInitialized(true)
        }
      } catch (error) {
        console.error("[v0] MiniKit initialization error:", error)
        setIsInitialized(true) // Still set as initialized to prevent blocking
      }
    }

    initializeMiniKit()
  }, [])

  // Don't render children until MiniKit is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Initializing...</div>
      </div>
    )
  }

  return <>{children}</>
}
