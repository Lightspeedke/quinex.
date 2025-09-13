"use client"

import { useState, useCallback, useEffect } from "react"
import { MiniKit, type WalletAuthInput } from "@worldcoin/minikit-js"
import { Wallet, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

// Helper function to create wallet auth input
const walletAuthInput = (nonce: string): WalletAuthInput => {
  return {
    nonce,
    requestId: "0",
    expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
    statement: "Welcome to Anovus",
  }
}

interface LoginProps {
  onLoginSuccess: (userData: { walletAddress: string }) => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user is already logged in
  const refreshUserData = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated && data.user) {
          onLoginSuccess(data.user)
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }, [onLoginSuccess])

  useEffect(() => {
    refreshUserData()
  }, [refreshUserData])

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if MiniKit is installed
      if (!MiniKit.isInstalled()) {
        window.open("https://www.worldcoin.org/minikit", "_blank")
        setError("MiniKit wallet is not installed. Please install it first.")
        return
      }

      // Step 1: Get a nonce from the server
      const nonceResponse = await fetch("/api/nonce")
      if (!nonceResponse.ok) {
        throw new Error("Failed to get authentication nonce")
      }
      const { nonce } = await nonceResponse.json()
      console.log("Received nonce:", nonce)

      // Step 2: Authenticate with MiniKit using walletAuth
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth(walletAuthInput(nonce))

      if (finalPayload.status === "error") {
        // Fix for type error - use a type-safe approach to access error information
        const errorMessage = "Authentication failed"
        console.error("Auth error payload:", finalPayload)
        setError(errorMessage)
        return
      }

      console.log("Authentication successful:", finalPayload)

      // Step 3: Send the authentication payload to the server
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      })

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json()
        throw new Error(errorData.message || "Authentication failed")
      }

      const loginData = await loginResponse.json()
      console.log("Login response:", loginData)

      // Call the onLoginSuccess callback with the user data
      const userInfo = loginData.user || MiniKit.user
      onLoginSuccess(userInfo)
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Failed to login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -z-10" />

      <div className="relative w-full bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm shadow-xl overflow-hidden">
        {/* Glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 opacity-50" />

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/5 rounded-full blur-xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/5 rounded-full blur-xl" />

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-3 p-1">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Wallet size={24} className="text-gray-900" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Connect Wallet</h2>
            <p className="text-gray-300 text-center text-sm">Connect your MiniKit wallet to access your account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg"
            >
              <div className="flex items-start">
                <ShieldCheck size={16} className="text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <motion.button
              onClick={handleLogin}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 flex items-center justify-center text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center">
                  <ShieldCheck size={16} className="mr-2" />
                  Connect with MiniKit
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
