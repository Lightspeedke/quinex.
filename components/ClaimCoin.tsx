"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, ArrowRight, CheckCircle, Clock, Shield, RefreshCw } from "lucide-react"
import { Info } from "lucide-react"

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

// Analytics tracking function
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  console.log(`[Analytics] ${eventName}`, properties)
  // Replace with your analytics implementation
}

// Global storage key for claim timer
const getClaimTimerKey = () => "quinex_next_claim_time"

export function ClaimCoin({ userAddress }: ClaimCoinProps) {
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
  const [countdownState, setCountdownState] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  const fetchRealBalance = async (): Promise<string> => {
    try {
      // Simulate real balance from localStorage or API
      const storedBalance = localStorage.getItem(`quinex_balance_${userAddress}`)
      if (storedBalance) {
        return storedBalance
      }

      // Initialize with random balance between 100-1000 QIX
      const initialBalance = (Math.random() * 900 + 100).toFixed(2)
      localStorage.setItem(`quinex_balance_${userAddress}`, initialBalance)
      return initialBalance
    } catch (error) {
      console.error("Error fetching balance:", error)
      return "0"
    }
  }

  // Load next claim time from localStorage
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
            localStorage.removeItem(getClaimTimerKey())
            setNextClaimTime(null)
          }
        }
      } catch (error) {
        console.error("Error loading claim timer:", error)
      }
    }

    loadClaimTimer()
    const checkTimerInterval = setInterval(loadClaimTimer, 1000)
    return () => clearInterval(checkTimerInterval)
  }, [])

  // Update countdown timer every second
  useEffect(() => {
    if (!nextClaimTime) {
      setCountdownState({ hours: 0, minutes: 0, seconds: 0 })
      return
    }

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

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [nextClaimTime])

  const fetchUserBalance = async () => {
    try {
      setIsLoadingBalance(true)
      const realBalance = await fetchRealBalance()
      setBalance(realBalance)
      console.log(`Balance updated: ${realBalance} QIX`)
    } catch (error) {
      console.error("Error fetching user balance:", error)
      setBalance("0")
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // Fetch balance when component mounts
  useEffect(() => {
    if (userAddress) {
      fetchUserBalance()
    }
  }, [userAddress])

  // Reset retry count when user changes
  useEffect(() => {
    setRetryCount(0)
  }, [userAddress])

  const handleClaim = async () => {
    try {
      trackEvent("claim_started", { userAddress })
      setIsClaiming(true)
      setError(null)

      console.log("Starting claim process for address:", userAddress)

      // Check if user can claim (24-hour cooldown)
      if (nextClaimTime && nextClaimTime > Date.now()) {
        const timeLeft = Math.ceil((nextClaimTime - Date.now()) / 1000)
        const hours = Math.floor(timeLeft / 3600)
        const minutes = Math.floor((timeLeft % 3600) / 60)
        const seconds = timeLeft % 60
        const timeString = `${hours}h ${minutes}m ${seconds}s`
        throw new Error(`You need to wait ${timeString} before claiming again.`)
      }

      // Simulate transaction processing
      console.log("Processing claim transaction...")
      await new Promise((resolve) => setTimeout(resolve, 2000)) // 2 second delay

      // Update balance with claimed tokens
      const currentBalance = await fetchRealBalance()
      const claimAmount = 1 // 1 QNX per claim
      const newBalance = (Number.parseFloat(currentBalance) + claimAmount).toFixed(2)
      localStorage.setItem(`quinex_balance_${userAddress}`, newBalance)
      setBalance(newBalance)

      console.log("Claim process completed")
      setClaimSuccess(true)

      // Set the next claim time to 24 hours from now
      const nextClaimTimeValue = Date.now() + 24 * 60 * 60 * 1000
      setNextClaimTime(nextClaimTimeValue)
      setCountdownState({ hours: 24, minutes: 0, seconds: 0 })

      // Store the next claim time in localStorage
      localStorage.setItem(getClaimTimerKey(), nextClaimTimeValue.toString())
      console.log(`Set next claim time to: ${new Date(nextClaimTimeValue).toLocaleString()}`)

      trackEvent("claim_success", { userAddress, claimAmount })

      // Hide success message after 3 seconds
      setTimeout(() => {
        setClaimSuccess(false)
      }, 3000)
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
    const maxSwipe = trackWidth - 60

    const delta = clientX - swipeStart
    const newPosition = Math.max(0, Math.min(delta, maxSwipe))
    setSwipePosition(newPosition)

    if (newPosition >= swipeThreshold) {
      setSwipeComplete(true)
    }
  }

  const handleSwipeEnd = () => {
    if (swipeStart === null) return

    if (swipeComplete) {
      handleClaim()
    } else {
      setSwipePosition(0)
    }

    setSwipeStart(null)
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
      const balanceNum = Number.parseFloat(balanceStr)
      if (isNaN(balanceNum)) return "0"
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
    fetchUserBalance()
  }

  // Calculate total tokens to be claimed
  const calculateTotalClaim = () => {
    return 1 // 1 QNX per claim
  }

  const resetClaimTimer = () => {
    localStorage.removeItem(getClaimTimerKey())
    setNextClaimTime(null)
    setCountdownState({ hours: 0, minutes: 0, seconds: 0 })
    console.log("Claim timer reset - user can claim immediately")
  }

  return (
    <div className="flex flex-col items-center justify-between h-full px-4 py-2 overflow-hidden">
      {/* Balance Display */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Your QNX Balance</p>
              <p className="text-2xl font-bold text-amber-400">
                {isLoadingBalance ? <span className="animate-pulse">Loading...</span> : `${formatBalance(balance)} QNX`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetClaimTimer}
                className="p-2 rounded-lg bg-red-700/50 hover:bg-red-700 transition-colors text-xs"
                title="Reset claim timer (for testing)"
              >
                Reset
              </button>
              <button
                onClick={handleRefreshBalance}
                disabled={isLoadingBalance}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoadingBalance ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

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
              <span>Swipe to Claim 1 QNX</span>
              <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Progress bar for swipe */}
        {swipePosition > 0 && (
          <div
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-amber-400/20 to-orange-500/30"
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
          <p className="text-xs text-gray-300 text-center">Claim 1 QNX token daily to build your Quinex portfolio.</p>
        </div>
      </motion.div>
    </div>
  )
}
