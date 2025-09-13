"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ClaimCoinReal } from "@/components/ClaimCoinReal"
import { Info, AlertCircle, Users, Wallet } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import LearnToEarn from "@/components/LearnToEarn"
import StakingPool from "@/components/StakingPool"
import GovernanceVoting from "@/components/GovernanceVoting"
import NFTMarketplace from "@/components/NFTMarketplace"
import TokenSwap from "@/components/TokenSwap"
import AIChat from "@/components/AIChat"
import { MiniKit, VerificationLevel } from "@worldcoin/minikit-js"
import { useAuth } from "@/components/auth-provider"

interface User {
  id: string
  walletAddress: string
  username: string | null
  profilePictureUrl: string | null
  isNewUser: boolean
}

export default function Home() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth()
  const [loginError, setLoginError] = useState("")
  const [showSplash, setShowSplash] = useState(true)
  const [activeTab, setActiveTab] = useState<"claim" | "stake" | "swap" | "governance" | "nft" | "ai" | "about">(
    "claim",
  )
  const [learnToEarnCompleted, setLearnToEarnCompleted] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const [isMiniKitAvailable, setIsMiniKitAvailable] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const getUserCount = (): number => {
    try {
      const storedCount = localStorage.getItem("quinex_user_count")
      if (storedCount) {
        return Number.parseInt(storedCount, 10)
      }
      const baseCount = 12847 + Math.floor(Math.random() * 1000)
      localStorage.setItem("quinex_user_count", baseCount.toString())
      return baseCount
    } catch (error) {
      console.error("Error getting user count:", error)
      return 12847
    }
  }

  const incrementUserCount = () => {
    try {
      const currentCount = getUserCount()
      const newCount = currentCount + 1
      localStorage.setItem("quinex_user_count", newCount.toString())
      setUserCount(newCount)
    } catch (error) {
      console.error("Error incrementing user count:", error)
    }
  }

  const signInWithWallet = async () => {
    try {
      setIsConnecting(true)
      setLoginError("")

      console.log("[v0] Starting World App wallet authentication...")

      if (!MiniKit.isInstalled()) {
        console.log("[v0] MiniKit not installed")
        setLoginError("This feature requires World App")
        return
      }

      console.log("[v0] Getting nonce from backend...")
      const nonceRes = await fetch(`/api/nonce`)
      if (!nonceRes.ok) {
        throw new Error("Failed to get nonce")
      }
      const { nonce } = await nonceRes.json()
      console.log("[v0] Received nonce:", nonce)

      console.log("[v0] Initiating MiniKit walletAuth...")
      const { commandPayload: generateMessageResult, finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: "0",
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: "Sign in to Quinex DeFi Platform",
      })

      console.log("[v0] MiniKit walletAuth result:", { generateMessageResult, finalPayload })

      if (finalPayload.status === "error") {
        console.log("[v0] Wallet authentication failed:", finalPayload)
        setLoginError("Wallet authentication failed")
        return
      }

      console.log("[v0] Verifying SIWE message with backend...")
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      })

      const verifyResult = await response.json()
      console.log("[v0] SIWE verification result:", verifyResult)

      if (response.ok && verifyResult.isValid) {
        await refreshUser()
        incrementUserCount()
        console.log("[v0] World App wallet connected successfully:", finalPayload.address)
      } else {
        console.log("[v0] Wallet verification failed:", verifyResult)
        setLoginError("Wallet verification failed")
      }
    } catch (error) {
      console.error("[v0] World App wallet authentication error:", error)
      setLoginError("Failed to authenticate with World App wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const connectExternalWallet = async () => {
    try {
      setIsConnecting(true)
      setLoginError("")

      console.log("[v0] Starting external wallet connection...")

      if (typeof window.ethereum === "undefined") {
        setLoginError("Please install MetaMask or another Web3 wallet")
        return
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        setLoginError("No accounts found. Please connect your wallet.")
        return
      }

      const walletAddress = accounts[0]

      const existingSession = localStorage.getItem(`quinex_wallet_${walletAddress}`)
      const isNewUser = !existingSession

      const walletUser = {
        id: walletAddress,
        walletAddress: walletAddress,
        username: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        profilePictureUrl: null,
        isNewUser: isNewUser,
      }

      localStorage.setItem(`quinex_wallet_${walletAddress}`, JSON.stringify(walletUser))

      if (isNewUser) {
        incrementUserCount()
      }

      await refreshUser()
      console.log("[v0] External wallet connected successfully:", walletAddress)
    } catch (error) {
      console.error("[v0] External wallet connection error:", error)
      setLoginError("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleWorldIDSignIn = async () => {
    try {
      setLoginError("")
      setIsConnecting(true)

      console.log("[v0] Starting World ID sign in...")

      if (!MiniKit.isInstalled()) {
        setLoginError("World App is required for World ID sign in")
        return
      }

      const { commandPayload: verifyCommandPayload } = await MiniKit.commandsAsync.verify({
        action: "quinex-signin",
        signal: "quinex-user-verification",
        verification_level: VerificationLevel.Orb,
      })

      console.log("[v0] World ID verification result:", verifyCommandPayload)

      if (verifyCommandPayload.status === "error") {
        setLoginError("World ID verification failed")
        return
      }

      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: verifyCommandPayload,
          action: "quinex-signin",
          signal: "quinex-user-verification",
        }),
      })

      const verifyResponseJson = await verifyResponse.json()

      if (verifyResponse.ok && verifyResponseJson.success) {
        const worldIdUser = {
          id: verifyResponseJson.nullifier_hash || "world-id-user",
          walletAddress: verifyResponseJson.wallet_address || "0x0000000000000000000000000000000000000000",
          username: "World ID User",
          profilePictureUrl: null,
          isNewUser: !localStorage.getItem("quinex_world_id_session"),
        }

        localStorage.setItem("quinex_world_id_session", JSON.stringify(worldIdUser))

        if (worldIdUser.isNewUser) {
          incrementUserCount()
        }

        await refreshUser()
        console.log("[v0] World ID sign in successful")
      } else {
        setLoginError(verifyResponseJson.detail || "World ID verification failed")
      }
    } catch (error) {
      console.error("[v0] World ID sign in error:", error)
      setLoginError("Failed to sign in with World ID")
    } finally {
      setIsConnecting(false)
    }
  }

  useEffect(() => {
    const learnCompleted = localStorage.getItem("learn_to_earn_completed")
    if (learnCompleted === "true") {
      setLearnToEarnCompleted(true)
    }

    setUserCount(getUserCount())

    const initializeApp = async () => {
      try {
        if (typeof window === "undefined") {
          setShowSplash(false)
          return
        }

        console.log("[v0] Initializing app...")
        console.log("[v0] User Agent:", window.navigator.userAgent)
        console.log("[v0] Location:", window.location.href)

        await new Promise((resolve) => setTimeout(resolve, 1000))

        const miniKitInstalled = MiniKit.isInstalled()
        console.log("[v0] MiniKit installation status:", miniKitInstalled)

        const isWorldApp =
          miniKitInstalled &&
          (window.navigator.userAgent.includes("WorldApp") ||
            window.navigator.userAgent.includes("World App") ||
            window.location.hostname.includes("worldapp") ||
            // @ts-ignore - Check for World App specific globals
            typeof window.WorldApp !== "undefined" ||
            // @ts-ignore - Check for MiniKit specific globals
            typeof window.MiniKit !== "undefined")

        console.log("[v0] Is World App environment:", isWorldApp)
        setIsMiniKitAvailable(isWorldApp)

        setTimeout(() => {
          setShowSplash(false)
        }, 2000)
      } catch (error) {
        console.error("[v0] Error initializing app:", error)
        setShowSplash(false)
      }
    }

    initializeApp()
  }, [])

  const handleLearnToEarnComplete = () => {
    setLearnToEarnCompleted(true)
    localStorage.setItem("learn_to_earn_completed", "true")
  }

  return (
    <main className="flex h-screen flex-col bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {isAuthenticated && user ? (
        <div className="h-full flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center p-2 mt-1"
          >
            <div className="bg-gray-800/50 rounded-full p-1 flex w-full max-w-2xl shadow-lg overflow-x-auto">
              {[
                { key: "claim", label: "Claim" },
                { key: "governance", label: "Vote" },
                { key: "nft", label: "NFTs" },
                { key: "ai", label: "AI" },
                { key: "stake", label: "Stake" },
                { key: "swap", label: "Swap" },
                { key: "about", label: "About" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 py-2 px-3 rounded-full text-center transition-all duration-300 whitespace-nowrap text-xs ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-medium shadow-lg"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

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
                user.walletAddress ? (
                  learnToEarnCompleted ? (
                    <ClaimCoinReal userAddress={user.walletAddress} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <LearnToEarn onComplete={handleLearnToEarnComplete} />
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50 shadow-lg text-center max-w-md"
                    >
                      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Authentication Required</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Please connect your wallet to access the token claiming feature.
                      </p>
                      <button
                        onClick={() => setActiveTab("about")}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-medium rounded-lg hover:shadow-lg transition-all duration-300 text-sm"
                      >
                        View About Section
                      </button>
                    </motion.div>
                  </div>
                )
              ) : activeTab === "stake" ? (
                <StakingPool userAddress={user.walletAddress} />
              ) : activeTab === "swap" ? (
                <TokenSwap userAddress={user.walletAddress} />
              ) : activeTab === "governance" ? (
                <GovernanceVoting userAddress={user.walletAddress} />
              ) : activeTab === "nft" ? (
                <NFTMarketplace userAddress={user.walletAddress} />
              ) : activeTab === "ai" ? (
                <AIChat userAddress={user.walletAddress} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-4 backdrop-blur-sm border border-gray-700/50 shadow-lg"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mr-3">
                        <Image src="/logo.png" width={30} height={30} alt="Quinex Logo" className="rounded-full" />
                      </div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        Quinex Ecosystem
                      </h3>
                    </div>

                    <div className="flex items-center justify-center mb-3 p-2 bg-gray-700/30 rounded-lg">
                      <Users className="w-4 h-4 text-amber-400 mr-2" />
                      <span className="text-sm text-gray-300">
                        <span className="font-bold text-amber-400">{userCount.toLocaleString()}</span> Active Users
                      </span>
                    </div>

                    <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                      Quinex (QIX) is a comprehensive DeFi ecosystem offering staking rewards, governance voting, NFT
                      marketplace, and real-world utility. Earn tokens through verified daily claims and participate in
                      our growing decentralized platform.
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-xs text-gray-300">
                        <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                        <span>Staking Pools with up to 25% APY</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-300">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                        <span>DAO Governance & Community Voting</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-300">
                        <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                        <span>Exclusive NFT Marketplace</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        <span>Merchant Payment Network</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span>Learn-to-Earn Educational Rewards</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-300">
                        <div className="w-2 h-2 bg-teal-400 rounded-full mr-2"></div>
                        <span>AI Chat Integration</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="https://x.com/quinextoken?t=U0Z_OVp_wRXlqUwL5ncVKw&s=08"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 text-sm"
                      >
                        Learn More About QIX
                      </motion.a>
                    </div>
                  </motion.div>
                </div>
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
                  alt="Quinex Logo"
                  className="rounded-full relative z-10"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2"
              >
                Welcome to Quinex
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-gray-300 text-sm"
              >
                Connect your wallet to access the DeFi platform
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex items-center justify-center mt-3 text-xs text-gray-400"
              >
                <Users className="w-3 h-3 mr-1" />
                <span>{userCount.toLocaleString()} users already joined</span>
              </motion.div>
            </div>

            <div className="space-y-3">
              {isMiniKitAvailable ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={signInWithWallet}
                  disabled={isConnecting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-medium rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Wallet className="w-5 h-5" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={connectExternalWallet}
                  disabled={isConnecting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-medium rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Wallet className="w-5 h-5" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </motion.button>
              )}

              <p className="text-xs text-gray-400 text-center">
                {isMiniKitAvailable
                  ? "Use World App's native wallet for secure authentication."
                  : "Please open this app in World App for the best experience, or connect an external wallet."}
              </p>
            </div>

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
    </main>
  )
}
