"use client"

import { useEffect, useState } from "react"
import { MiniKit } from "@worldcoin/minikit-js"
import Login from "@/components/Login"
import Image from "next/image"
import { ClaimCoin } from "@/components/ClaimCoin"
import Link from "next/link"
import { ExternalLink, Info, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  id: string
  walletAddress: string
  username: string | null
  profilePictureUrl: string | null
  isNewUser: boolean
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loginError, setLoginError] = useState("")
  const [showSplash, setShowSplash] = useState(true)
  const [activeTab, setActiveTab] = useState<"claim" | "about">("claim")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkMiniKit = async () => {
      try {
        const isInstalled = MiniKit.isInstalled()
        if (isInstalled) {
          // Wait for a short time to show the splash animation
          setTimeout(() => {
            setShowSplash(false)
            setIsLoading(false)
          }, 2000)

          // Check if user is already logged in
          try {
            const response = await fetch("/api/auth/me")
            if (response.ok) {
              const data = await response.json()
              if (data.authenticated && data.user) {
                setUser(data.user)
                setIsLoggedIn(true)
              }
            }
          } catch (error) {
            console.error("Error checking auth status:", error)
            setLoginError("Failed to check auth status")
            setIsLoading(false)
          }
        } else {
          setTimeout(checkMiniKit, 500)
        }
      } catch (error) {
        console.error("Error checking MiniKit:", error)
        setIsLoading(false)
        setLoginError("Failed to initialize MiniKit")
      }
    }

    checkMiniKit()
  }, [])

  const handleLoginSuccess = (userData: { walletAddress: string }) => {
    // After successful login, fetch the complete user data
    fetch("/api/auth/me")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }
        return response.json()
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user)
          setIsLoggedIn(true)
          setLoginError("")
        } else {
          throw new Error("Authentication failed")
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error)
        setLoginError("Failed to complete login")
      })
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })
      if (response.ok) {
        setIsLoggedIn(false)
        setUser(null)
      } else {
        throw new Error("Logout failed")
      }
    } catch (error) {
      console.error("Logout error:", error)
      setLoginError("Logout failed")
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Splash Screen with enhanced animation
  if (showSplash) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="relative w-32 h-32"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl animate-pulse" />
            <Image src="/logo.png" width={120} height={120} alt="Anovus Logo" className="rounded-full relative z-10" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"
          >
            Quinex
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-2 text-sm text-gray-400"
          >
            Loading application...
          </motion.p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <main className="flex h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-16 h-16">
            <svg
              className="animate-spin h-16 w-16 text-orange-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="mt-6 text-lg font-medium text-orange-500">Loading MiniKit...</p>
          <p className="mt-2 text-sm text-gray-400">Please wait while we initialize the application</p>
        </div>
      </main>
    )
  }

  const AboutContent = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
      {/* About Anovus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-4 backdrop-blur-sm border border-gray-700/50 shadow-lg"
      >
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mr-3">
            <Image src="/logo.png" width={30} height={30} alt="Anovus Logo" className="rounded-full" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            About Anovus
          </h3>
        </div>
        <p className="text-gray-300 mb-4 text-sm leading-relaxed">
          Quinex is the future of digital currency - secure, fast, and decentralized. Experience the next generation of
          Worldcoin tokens with Quinex.
        </p>
        <div className="flex justify-center">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://x.com/quinextoken?t=U0Z_OVp_wRXlqUwL5ncVKw&s=08"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 text-sm"
          >
            Visit Quinex Website
            <ExternalLink size={14} />
          </motion.a>
        </div>
      </motion.div>

      {/* Follow for updates section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-md bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-4 backdrop-blur-sm border border-gray-700/50 shadow-lg"
      >
        <h3 className="text-base font-semibold text-white mb-3">Follow for updates</h3>
        <div className="grid grid-cols-2 gap-2">
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="https://x.com/quinextoken?t=U0Z_OVp_wRXlqUwL5ncVKw&s=08"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 bg-gradient-to-b from-gray-800 to-gray-900 text-white rounded-lg hover:shadow-md transition-all duration-300 border border-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="font-medium text-xs">Follow on X</span>
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="https://t.me/QUiNEXtoken"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 bg-gradient-to-b from-gray-800 to-gray-900 text-white rounded-lg hover:shadow-md transition-all duration-300 border border-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 4.5L2.5 12.5L21.5 20.5L21.5 4.5Z"></path>
              <path d="M12 12.5L21.5 4.5"></path>
              <path d="M2.5 12.5L12 17.5L17 22.5"></path>
              <path d="M17 22.5L21.5 20.5"></path>
            </svg>
            <span className="font-medium text-xs">Join Telegram</span>
          </motion.a>
        </div>

        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <h4 className="text-xs font-medium text-amber-400 mb-1">Latest Updates</h4>
          <p className="text-xs text-gray-300">
            Stay informed about new features, token distributions, and community events.
          </p>
        </div>
      </motion.div>
    </div>
  )

  return (
    <main className="flex h-screen flex-col bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      {/* Background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {isLoggedIn && user ? (
        <div className="h-full flex flex-col">
          {/* Header with user info and logout */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-between items-center px-4 py-2"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mr-2">
                <Image src="/logo.png" width={20} height={20} alt="Anovus Logo" className="rounded-full" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Connected as</p>
                <p className="text-sm text-gray-200 font-medium">
                  {user.username || user.walletAddress.substring(0, 6) + "..." + user.walletAddress.substring(38)}
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleLogout}
              disabled={isLoggingOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-colors border border-gray-700"
            >
              {isLoggingOut ? (
                <svg
                  className="animate-spin h-3 w-3 text-gray-400 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <LogOut size={12} className="mr-1" />
              )}
              {isLoggingOut ? "Logging out..." : "Logout"}
            </motion.button>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center p-3"
          >
            <div className="bg-gray-800/50 rounded-full p-1 flex w-full max-w-xs shadow-lg">
              <button
                onClick={() => setActiveTab("claim")}
                className={`flex-1 py-2 px-4 rounded-full text-center transition-all duration-300 ${
                  activeTab === "claim"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-medium shadow-lg"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Claim
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`flex-1 py-2 px-4 rounded-full text-center transition-all duration-300 ${
                  activeTab === "about"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-medium shadow-lg"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                About
              </button>
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-hidden"
            >
              {activeTab === "claim" ? (
                user.walletAddress && <ClaimCoin userAddress={user.walletAddress} />
              ) : (
                <AboutContent />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative w-20 h-20 mx-auto mb-4"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl animate-pulse" />
                <Image
                  src="/logo.png"
                  width={80}
                  height={80}
                  alt="Anovus Logo"
                  className="rounded-full relative z-10"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2"
              >
                Welcome to Anovus
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-gray-300 text-sm"
              >
                Connect with MiniKit to claim your daily tokens
              </motion.p>
            </div>
            <Login onLoginSuccess={handleLoginSuccess} />
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-900/30 border border-red-800/50 rounded-xl text-red-300 text-xs"
              >
                <div className="flex items-start">
                  <Info size={16} className="text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p>{loginError}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-3 px-4 border-t border-gray-800/50 mt-auto">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image src="/logo.png" width={20} height={20} alt="Anovus Logo" className="rounded-full" />
            <span className="text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Anovus
            </span>
          </div>
          <div className="flex space-x-4">
            <Link href="/privacy-policy" className="text-xs text-gray-400 hover:text-amber-400 transition-colors">
              Privacy
            </Link>
            <a
              href="https://x.com/quinextoken?t=U0Z_OVp_wRXlqUwL5ncVKw&s=08"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-amber-400 transition-colors flex items-center"
            >
              Website <ExternalLink size={10} className="ml-1" />
            </a>
            <a
              href="https://t.me/QUiNEXtoken"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-amber-400 transition-colors flex items-center"
            >
              Telegram <ExternalLink size={10} className="ml-1" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
