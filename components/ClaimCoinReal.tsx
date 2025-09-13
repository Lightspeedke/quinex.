"use client"
import { useState, useEffect, useRef } from "react"
import DEXABI from "@/components/abi/DEX.json"
import { MiniKit } from "@worldcoin/minikit-js"
import Cookies from "js-cookie"
import { verifyTransaction } from "@/app/actions/verify-transaction"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, ArrowRight, CheckCircle, Clock, Shield, RotateCcw } from "lucide-react"
import { Info } from "lucide-react"

const CLAIM_CONTRACT_ADDRESS = "0x90cEdC950359Dbb5fa2fA2d32E686b2d9E10B75C"
const TOKEN_CONTRACT_ADDRESS = "0x029A50BC15da765Dc45861e416AD9644f87e52Ec"

// Add the getErrorMessage helper function here
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (typeof err === "object" && err !== null && "message" in err) return String((err as { message: unknown }).message)
  return "Failed to claim tokens. Please try again."
}

// Types
type ClaimCoinProps = {
  userAddress: string
}

interface ClaimStatusResponse {
  success: boolean
  address?: string
  lastClaimed?: number
  canClaim?: boolean
  nextClaimTime?: number
  timeLeft?: number
  claimAmount?: string
  balance?: string
  rpcUsed?: string
  error?: string
  details?: string
}

interface WalletToken {
  contractAddress: string
  balance: string
  decimals: number
  name: string
  symbol: string
  logo: string
  balanceFormatted: string
  isQNX: boolean
}

// Analytics tracking function
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  console.log(`[Analytics] ${eventName}`, properties)
  // Replace with your analytics implementation
  // Example: mixpanel.track(eventName, properties);
}

// Global storage key for claim timer
const getClaimTimerKey = () => "astra_next_claim_time"

export function ClaimCoinReal({ userAddress }: ClaimCoinProps) {
  // State
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Swipe state
  const [swipeStart, setSwipeStart] = useState<number | null>(null)
  const [swipePosition, setSwipePosition] = useState(0)
  const [swipeComplete, setSwipeComplete] = useState(false)
  const swipeThreshold = 200 // Minimum distance to swipe in pixels
  const swipeTrackRef = useRef<HTMLDivElement>(null)

  // Countdown timer state
  const [nextClaimTime, setNextClaimTime] = useState<number | null>(null)
  // Add countdown state to force re-renders
  const [countdownState, setCountdownState] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [realQnxBalance, setRealQnxBalance] = useState<string>("0")

  // Load next claim time from localStorage - using a global key instead of user-specific
  useEffect(() => {
    const loadClaimTimer = () => {
      try {
        const storedNextClaimTime = localStorage.getItem(getClaimTimerKey())
        if (storedNextClaimTime) {
          const parsedTime = Number.parseInt(storedNextClaimTime, 10)
          if (!isNaN(parsedTime) && parsedTime > Date.now()) {
            console.log(`Loaded claim timer: ${new Date(parsedTime).toLocaleString()}`)
            setNextClaimTime(parsedTime)
          } else {
            // Clear expired timer
            console.log("Claim timer expired, clearing")
            localStorage.removeItem(getClaimTimerKey())
            setNextClaimTime(null)
          }
        }
      } catch (error) {
        console.error("Error loading claim timer:", error)
      }
    }

    loadClaimTimer()
    // Check for timer updates every second (in case it was updated in another tab)
    const checkTimerInterval = setInterval(loadClaimTimer, 1000)
    return () => clearInterval(checkTimerInterval)
  }, [])

  // Update countdown timer every second
  useEffect(() => {
    if (!nextClaimTime) {
      setCountdownState({ hours: 0, minutes: 0, seconds: 0 })
      return
    }

    // Calculate and update countdown immediately
    const updateCountdown = () => {
      const timeLeft = Math.max(0, nextClaimTime - Date.now())
      const hours = Math.floor(timeLeft / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      setCountdownState({ hours, minutes, seconds })

      if (timeLeft <= 0) {
        setNextClaimTime(null)
        localStorage.removeItem(getClaimTimerKey())
        console.log("Timer expired, cleared from localStorage")
      }
    }

    // Update immediately and then every second
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [nextClaimTime])

  // Function to fetch user claim status and balance from the API
  const fetchUserClaimStatus = async () => {
    try {
      setIsLoadingBalance(true)
      console.log(`Fetching claim status for address: ${userAddress}`)
      const response = await fetch(`/api/confirm-payment/${userAddress}`)

      if (!response.ok) {
        console.error(`API returned error status: ${response.status}`)
        throw new Error(`API error: ${response.status}`)
      }

      const data: ClaimStatusResponse = await response.json()
      console.log("Claim status data:", data)

      if (!data.success) {
        console.error("API returned error:", data.error)
        throw new Error(data.error || "Failed to fetch claim status")
      }

      // Update balance from API response
      if (data.balance) {
        setBalance(data.balance)
        console.log(`Balance updated from API: ${data.balance}`)
      } else {
        // If balance is missing from the API response, set to null
        console.log("Balance missing from API response")
        setBalance(null)
      }

      // If the API returns nextClaimTime, use it to update the timer
      if (data.nextClaimTime && data.nextClaimTime > Math.floor(Date.now() / 1000)) {
        const nextClaimTimeMs = data.nextClaimTime * 1000 // Convert from seconds to milliseconds
        setNextClaimTime(nextClaimTimeMs)
        localStorage.setItem(getClaimTimerKey(), nextClaimTimeMs.toString())
        console.log(`Next claim time updated from API: ${new Date(nextClaimTimeMs).toLocaleString()}`)
      } else if (data.canClaim === false && data.timeLeft && data.timeLeft > 0) {
        // Alternative way to set the timer if nextClaimTime is not provided but timeLeft is
        const nextClaimTimeMs = Date.now() + data.timeLeft * 1000
        setNextClaimTime(nextClaimTimeMs)
        localStorage.setItem(getClaimTimerKey(), nextClaimTimeMs.toString())
        console.log(`Next claim time calculated from timeLeft: ${new Date(nextClaimTimeMs).toLocaleString()}`)
      }

      return data
    } catch (error) {
      console.error("Error fetching user claim status:", error)
      // Don't throw here, just return null to indicate failure
      return null
    } finally {
      setIsLoadingBalance(false)
    }
  }

  const fetchWalletTokens = async () => {
    try {
      setIsLoadingTokens(true)
      console.log(`[v0] Fetching wallet tokens for: ${userAddress}`)

      const response = await fetch(`/api/wallet-tokens?address=${userAddress}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet tokens: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[v0] Wallet tokens data:`, data)

      if (data.tokens) {
        setWalletTokens(data.tokens)
        setRealQnxBalance(data.qnxBalance || "0")
        console.log(`[v0] Updated wallet tokens: ${data.tokens.length} tokens, QNX: ${data.qnxBalance}`)
      }
    } catch (error) {
      console.error("[v0] Error fetching wallet tokens:", error)
      setWalletTokens([])
      setRealQnxBalance("0")
    } finally {
      setIsLoadingTokens(false)
    }
  }

  // Add a useEffect to fetch the claim status when component mounts or userAddress changes
  useEffect(() => {
    if (userAddress) {
      fetchUserClaimStatus()
      fetchWalletTokens()
    }
  }, [userAddress]) // Re-fetch when userAddress changes

  // Reset retry count when user changes
  useEffect(() => {
    setRetryCount(0)
  }, [userAddress])

  const extractTransactionId = (result: any): string => {
    console.log("Attempting to extract transaction ID from result:", JSON.stringify(result, null, 2))

    if (!result) {
      console.error("Result is null or undefined")
      return ""
    }

    if (result.transaction_id && typeof result.transaction_id === "string") {
      console.log("Found transaction_id in standard response format:", result.transaction_id)
      return result.transaction_id
    }

    // If result is a string, it might be the transaction ID directly
    if (typeof result === "string") {
      if (result.startsWith("0x")) {
        console.log("Result is a hex string, using directly:", result)
        return result
      } else if (/^[0-9a-fA-F]+$/.test(result)) {
        // If it's a hex string without 0x prefix, add it
        const withPrefix = `0x${result}`
        console.log("Added 0x prefix to hex string:", withPrefix)
        return withPrefix
      }
    }

    // Log all top-level keys to help diagnose
    if (typeof result === "object") {
      console.log("Available keys in result:", Object.keys(result))
    }

    const possibleHashProps = ["transactionHash", "txHash", "hash", "id", "transaction", "tx", "txId", "transactionId"]

    for (const prop of possibleHashProps) {
      if (result[prop] && typeof result[prop] === "string") {
        if (result[prop].startsWith("0x")) {
          console.log(`Found transaction ID in property '${prop}':`, result[prop])
          return result[prop]
        } else if (/^[0-9a-fA-F]+$/.test(result[prop])) {
          // If it's a hex string without 0x prefix, add it
          const withPrefix = `0x${result[prop]}`
          console.log(`Added 0x prefix to hex string from '${prop}':`, withPrefix)
          return withPrefix
        }
      }
    }

    if (Array.isArray(result) && result.length > 0) {
      console.log("Result is an array, checking first item")
      const firstItem = result[0]
      if (typeof firstItem === "string") {
        if (firstItem.startsWith("0x")) {
          return firstItem
        } else if (/^[0-9a-fA-F]+$/.test(firstItem)) {
          return `0x${firstItem}`
        }
      }
      return extractTransactionId(firstItem)
    }

    for (const key in result) {
      if (result[key] && typeof result[key] === "object") {
        console.log(`Checking nested object '${key}'`)
        const nestedId = extractTransactionId(result[key])
        if (nestedId) return nestedId
      }
    }

    // If we still don't have a transaction ID, log the entire result for debugging
    console.error("Could not find transaction ID in result. Full result:", JSON.stringify(result, null, 2))
    return ""
  }

  const executeMiniKitTransaction = async () => {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("MiniKit wallet is not installed")
      }

      console.log("MiniKit is installed, preparing transaction...")
      const reference = `claim-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
      console.log("Generated reference:", reference)
      Cookies.set("payment-nonce", reference, { expires: 100 })

      const contractAddress = CLAIM_CONTRACT_ADDRESS
      console.log("Claim contract address:", contractAddress)
      console.log("User address:", userAddress)

      const claimFunction = DEXABI.find((item) => item.type === "function" && item.name === "claim")
      if (!claimFunction) {
        console.warn(
          "Warning: 'claim' function not found in ABI. Available functions:",
          DEXABI.filter((item) => item.type === "function")
            .map((f) => f.name)
            .join(", "),
        )
        const defaultClaimFunction = {
          type: "function",
          name: "claim",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        }

        const transactionPayload = {
          transaction: [
            {
              address: contractAddress,
              abi: [defaultClaimFunction],
              functionName: "claim",
              args: [],
            },
          ],
        }

        console.log("Transaction payload with default claim function:", JSON.stringify(transactionPayload, null, 2))
        const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

        console.log("Transaction sent successfully")
        console.log("Command payload:", commandPayload)
        console.log("Final payload:", finalPayload)

        const transactionId = extractTransactionId(finalPayload)
        return { result: finalPayload, transactionId, reference }
      } else {
        console.log("Claim function found in ABI:", claimFunction)

        const transactionPayload = {
          transaction: [
            {
              address: contractAddress,
              abi: [claimFunction],
              functionName: "claim",
              args: [],
            },
          ],
        }

        console.log("Transaction payload:", JSON.stringify(transactionPayload, null, 2))
        const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

        console.log("Transaction sent successfully")
        console.log("Command payload:", commandPayload)
        console.log("Final payload:", finalPayload)

        const transactionId = extractTransactionId(finalPayload)
        return { result: finalPayload, transactionId, reference }
      }
    } catch (error) {
      console.error("MiniKit transaction error:", error)
      throw error
    }
  }

  // Swipe gesture handlers
  const handleSwipeStart = (clientX: number) => {
    if (isClaiming || nextClaimTime !== null) return
    setSwipeStart(clientX)
    setSwipePosition(0)
    setSwipeComplete(false)
  }

  const handleSwipeMove = (clientX: number) => {
    if (swipeStart === null || isClaiming || nextClaimTime !== null) return

    const trackWidth = swipeTrackRef.current?.clientWidth || 300
    const maxSwipe = trackWidth - 60 // Subtract button width

    // Calculate how far we've swiped
    const delta = clientX - swipeStart
    // Constrain to track bounds (0 to maxSwipe)
    const newPosition = Math.max(0, Math.min(delta, maxSwipe))
    setSwipePosition(newPosition)

    // Check if we've swiped far enough to trigger the claim
    if (newPosition >= swipeThreshold) {
      setSwipeComplete(true)
    }
  }

  const handleSwipeEnd = () => {
    if (swipeStart === null) return

    if (swipeComplete) {
      // Swipe was completed, directly trigger claim
      handleClaim()
    } else {
      // Reset the swipe if not completed
      setSwipePosition(0)
    }

    setSwipeStart(null)
  }

  const handleClaim = async () => {
    try {
      trackEvent("claim_started", { userAddress })
      setIsClaiming(true)
      setError(null)

      console.log("Starting claim process for address:", userAddress)

      // Check if MiniKit is installed
      if (!MiniKit.isInstalled()) {
        throw new Error("MiniKit wallet is not installed. Please install it first.")
      }

      // Check if user can claim with improved error handling
      console.log(`Checking claim eligibility for ${userAddress}...`)
      const claimStatus = await fetchUserClaimStatus()

      if (!claimStatus) {
        throw new Error("Failed to check claim eligibility. Please try again.")
      }

      if (!claimStatus.canClaim) {
        // Show the specific reason why the user can't claim
        if (claimStatus.timeLeft && claimStatus.timeLeft > 0) {
          const hours = Math.floor(claimStatus.timeLeft / 3600)
          const minutes = Math.floor((claimStatus.timeLeft % 3600) / 60)
          const seconds = claimStatus.timeLeft % 60
          const timeString = `${hours}h ${minutes}m ${seconds}s`
          throw new Error(`You need to wait ${timeString} before claiming again.`)
        } else {
          throw new Error("You are not eligible to claim at this time.")
        }
      }

      // Execute the MiniKit transaction
      console.log("Executing MiniKit transaction...")
      try {
        const txResult = await executeMiniKitTransaction()
        console.log("Transaction result:", txResult)

        const { transactionId, reference } = txResult

        if (!transactionId) {
          throw new Error("Failed to get a valid transaction ID. Please try again.")
        }

        console.log("Transaction sent successfully, ID:", transactionId)

        // Verify the transaction with the backend
        try {
          console.log("Verifying transaction with backend...")
          console.log("Verification params:", {
            transactionId,
            reference,
            userAddress,
          })

          const verificationResult = await verifyTransaction({
            transactionId,
            reference,
            userAddress,
          })

          console.log("Verification result:", verificationResult)

          if (!verificationResult.success) {
            console.warn("Transaction verification warning:", verificationResult.message)
            // We'll continue anyway since the transaction was sent
          }
        } catch (verifyError) {
          console.error("Error during verification:", verifyError)
          // Continue anyway since the transaction was sent
        }

        console.log("Claim process completed")

        // Update local state to reflect successful claim
        // Instead of switching to success UI, just show a temporary success message
        setClaimSuccess(true)

        // Set the next claim time to 24 hours from now
        const nextClaimTimeValue = Date.now() + 24 * 60 * 60 * 1000
        setNextClaimTime(nextClaimTimeValue)
        setCountdownState({
          hours: 24,
          minutes: 0,
          seconds: 0,
        })

        // Store the next claim time in localStorage with a global key
        localStorage.setItem(getClaimTimerKey(), nextClaimTimeValue.toString())
        console.log(`Set next claim time to: ${new Date(nextClaimTimeValue).toLocaleString()}`)

        // Fetch the updated balance after successful claim
        // Wait a bit to allow the transaction to be processed on the blockchain
        setTimeout(async () => {
          await fetchUserClaimStatus()
          await fetchWalletTokens() // Also refresh wallet tokens
        }, 2000) // Wait 2 seconds before refreshing

        trackEvent("claim_success", { userAddress, transactionId })

        // Show success message temporarily
        setTimeout(() => {
          setClaimSuccess(false)
        }, 3000) // Hide success message after 3 seconds
      } catch (txError) {
        console.error("Transaction error:", txError)
        throw txError // Re-throw to be caught by the outer catch
      }
    } catch (err) {
      console.error("Claim error:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      trackEvent("claim_error", { userAddress, error: errorMessage })
    } finally {
      setIsClaiming(false)
      setSwipePosition(0)
      setSwipeComplete(false)
    }
  }

  // Format time for countdown display
  const formatCountdown = () => {
    if (!nextClaimTime) return { hours: 0, minutes: 0, seconds: 0 }
    const timeLeft = Math.max(0, nextClaimTime - Date.now())
    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
    return { hours, minutes, seconds }
  }

  const countdown = formatCountdown()

  // Calculate progress percentage for the circular progress
  const calculateProgress = () => {
    if (!swipeThreshold || swipePosition === 0) return 0
    return Math.min(100, (swipePosition / swipeThreshold) * 100)
  }

  // Format balance for display
  const formatBalance = (balanceStr: string | null): string => {
    if (!balanceStr) return "0"
    try {
      // Parse the balance string to a number
      const balanceNum = Number.parseFloat(balanceStr)
      // Check if it's a valid number
      if (isNaN(balanceNum)) return "0"
      // Format with commas for thousands
      return balanceNum.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })
    } catch (error) {
      console.error("Error formatting balance:", error)
      return "0"
    }
  }

  // Handle manual balance refresh
  const handleRefreshBalance = () => {
    fetchUserClaimStatus()
  }

  const calculateTotalClaim = () => {
    const baseTokens = 1
    return baseTokens
  }

  const resetClaimTimer = () => {
    localStorage.removeItem(getClaimTimerKey())
    console.log("Claim timer reset - user can claim immediately")
  }

  return (
    <div className="flex flex-col items-center justify-between h-full px-4 py-2 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Enhanced Circular claim button with logo */}
        <div className="relative mb-4">
          <motion.div
            className="w-52 h-52 rounded-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              boxShadow: "0 0 30px rgba(245, 159, 0, 0.15)",
            }}
          >
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-500/20 blur-md" />
            {/* Inner circle with logo */}
            <motion.div
              className="w-44 h-44 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden border-2 border-amber-500/30"
              animate={claimSuccess ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
            >
              <div className="w-full h-full relative">
                <Image src="/logo.png" alt="Quinex Logo" layout="fill" objectFit="cover" className="rounded-full" />
              </div>
            </motion.div>
            {/* Progress ring for swipe animation */}
            {swipePosition > 0 && (
              <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-52 h-52">
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeDasharray="302"
                  strokeDashoffset={302 - (swipePosition / swipeThreshold) * 302}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59f00" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </motion.div>
        </div>

        {/* Status message with enhanced rewards display */}
        <AnimatePresence mode="wait">
          {claimSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center space-y-2 bg-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-4"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Successfully claimed!</span>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-300">{calculateTotalClaim()} QNX</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-4">
              {nextClaimTime ? (
                <span className="text-gray-400 text-base font-light">Next claim available soon</span>
              ) : (
                <div className="space-y-1">
                  <span className="text-gray-300 text-base font-light block">Ready to claim your daily tokens</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message with improved styling */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/30 border border-red-800 text-red-300 px-3 py-2 rounded-lg mb-4 w-full max-w-md flex items-start"
          >
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs">{error}</p>
              {retryCount < MAX_RETRIES && (
                <button
                  onClick={() => {
                    setError(null)
                    setRetryCount((prev) => prev + 1)
                    setTimeout(() => {
                      handleClaim()
                    }, 500)
                  }}
                  className="mt-1 px-2 py-1 bg-red-800/50 hover:bg-red-800 text-red-200 text-xs font-medium rounded-md transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Swipe to claim UI */}
      <div
        ref={swipeTrackRef}
        className={`w-full max-w-md h-14 backdrop-blur-sm rounded-full relative overflow-hidden mb-4 border ${
          nextClaimTime !== null ? "bg-gray-800/40 border-gray-700/30" : "bg-gray-800/70 border-gray-700"
        }`}
      >
        {/* Track background with instruction text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isClaiming ? (
            <div className="flex items-center space-x-2 text-gray-300 font-medium text-sm">
              <svg
                className="animate-spin h-4 w-4 text-amber-400"
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
              <span>Processing...</span>
            </div>
          ) : nextClaimTime !== null ? (
            <div className="flex items-center space-x-2 text-gray-300 font-medium text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300">Next claim in: </span>
              <span className="bg-gray-800/70 px-2 py-1 rounded-md text-white font-mono">
                {countdownState.hours.toString().padStart(2, "0")}:{countdownState.minutes.toString().padStart(2, "0")}:
                {countdownState.seconds.toString().padStart(2, "0")}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-300 font-medium text-sm">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Swipe to Claim Tokens</span>
              <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Progress bar for swipe */}
        {swipePosition > 0 && (
          <div
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-amber-400 to-orange-500"
            style={{ width: `${calculateProgress()}%`, transition: "width 0.1s ease-out" }}
          />
        )}

        {/* Swipe button with enhanced styling */}
        <motion.div
          className={`absolute left-0 top-0 bottom-0 w-14 h-14 flex items-center justify-center ${
            nextClaimTime !== null
              ? "bg-gray-700/50 cursor-not-allowed border border-gray-600/30"
              : "bg-gradient-to-r from-amber-400 to-orange-500 cursor-grab active:cursor-grabbing"
          }`}
          style={{
            transform: `translateX(${swipePosition}px)`,
            transition: swipeStart === null ? "transform 0.3s ease" : "none",
            borderRadius: "50%",
          }}
          whileTap={nextClaimTime === null ? { scale: 0.95 } : undefined}
          onMouseDown={(e) => nextClaimTime === null && handleSwipeStart(e.clientX)}
          onTouchStart={(e) => nextClaimTime === null && handleSwipeStart(e.touches[0].clientX)}
          onMouseMove={(e) => nextClaimTime === null && handleSwipeMove(e.clientX)}
          onTouchMove={(e) => nextClaimTime === null && handleSwipeMove(e.touches[0].clientX)}
          onMouseUp={() => nextClaimTime === null && handleSwipeEnd()}
          onTouchEnd={() => nextClaimTime === null && handleSwipeEnd()}
          onMouseLeave={() => nextClaimTime === null && handleSwipeEnd()}
        >
          {nextClaimTime !== null ? (
            <Clock className="w-5 h-5 text-amber-400/70" />
          ) : (
            <Shield className="w-5 h-5 text-gray-900" />
          )}
        </motion.div>
      </div>

      {/* {nextClaimTime !== null && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            resetClaimTimer()
            setNextClaimTime(null)
            setCountdownState({ hours: 0, minutes: 0, seconds: 0 })
          }}
          className="mb-2 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Timer (Testing)
        </motion.button>
      )} */}

      {/* Token info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md"
      >
        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl p-3 backdrop-blur-sm border border-gray-700/50 shadow-md">
          <div className="flex items-center justify-center mb-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mr-1">
              <Info size={10} className="text-amber-400" />
            </div>
            <h4 className="text-xs font-medium text-amber-400">Daily Rewards System</h4>
          </div>
          <p className="text-xs text-gray-300 text-center">Claim 1 QNX daily from the World Chain contract.</p>
        </div>
      </motion.div>
    </div>
  )
}
