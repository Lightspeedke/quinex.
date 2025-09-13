"use client"
import { useState, useEffect, useRef } from "react"
import DEXABI from "@/components/abi/DEX.json"
import { MiniKit } from "@worldcoin/minikit-js"
import Cookies from "js-cookie"
import { verifyTransaction } from "@/app/actions/verify-transaction"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, CheckCircle, Clock, Shield, Star } from "lucide-react"
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

const DEX_CONTRACT_ADDRESS = "0x7AEC79E5d5E521d1486CE2443a0aab15Fa73Eeb7"

// Analytics tracking function
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  console.log(`[Analytics] ${eventName}`, properties)
  // Replace with your analytics implementation
  // Example: mixpanel.track(eventName, properties);
}

// Global storage key for claim timer
const getClaimTimerKey = () => "astra_next_claim_time"

export function EnhancedClaimCoin({ userAddress }: ClaimCoinProps) {
  // State
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Challenge state
  const [showChallenge, setShowChallenge] = useState(false)
  const [challengeCompleted, setChallengeCompleted] = useState(false)

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

      if (data.balance) {
        setBalance(data.balance)
        console.log(`Balance updated from API: ${data.balance}`)
      } else {
        console.log("Balance missing from API response")
        setBalance(null)
      }

      if (data.nextClaimTime && data.nextClaimTime > Math.floor(Date.now() / 1000)) {
        const nextClaimTimeMs = data.nextClaimTime * 1000
        setNextClaimTime(nextClaimTimeMs)
        localStorage.setItem(getClaimTimerKey(), nextClaimTimeMs.toString())
        console.log(`Next claim time updated from API: ${new Date(nextClaimTimeMs).toLocaleString()}`)
      } else if (data.canClaim === false && data.timeLeft && data.timeLeft > 0) {
        const nextClaimTimeMs = Date.now() + data.timeLeft * 1000
        setNextClaimTime(nextClaimTimeMs)
        localStorage.setItem(getClaimTimerKey(), nextClaimTimeMs.toString())
        console.log(`Next claim time calculated from timeLeft: ${new Date(nextClaimTimeMs).toLocaleString()}`)
      }

      return data
    } catch (error) {
      console.error("Error fetching user claim status:", error)
      return null
    } finally {
      setIsLoadingBalance(false)
    }
  }

  useEffect(() => {
    if (userAddress) {
      fetchUserClaimStatus()
    }
  }, [userAddress])

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
    if (typeof result === "string") {
      if (result.startsWith("0x")) {
        console.log("Result is a hex string, using directly:", result)
        return result
      } else if (/^[0-9a-fA-F]+$/.test(result)) {
        const withPrefix = `0x${result}`
        console.log("Added 0x prefix to hex string:", withPrefix)
        return withPrefix
      }
    }
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
      const contractAddress = DEX_CONTRACT_ADDRESS
      console.log("Contract address:", contractAddress)
      console.log("User address:", userAddress)
      const claimFunction = DEXABI.find((item) => item.type === "function" && item.name === "claim")
      if (!claimFunction) {
        console.warn(
          "Warning: 'claim' function not found in ABI. Available functions:",
          DEXABI.filter((item) => item.type === "function")
            .map((f) => f.name)
            .join(", "),
        )
      } else {
        console.log("Claim function found in ABI:", claimFunction)
      }
      let transactionId = ""
      let result
      try {
        console.log("Trying documented MiniKit transaction format...")
        const transactionPayload = {
          transaction: [
            {
              address: contractAddress,
              abi: [
                claimFunction || {
                  type: "function",
                  name: "claim",
                  inputs: [],
                  outputs: [],
                  stateMutability: "nonpayable",
                },
              ],
              functionName: "claim",
              args: [],
            },
          ],
        }
        console.log("Transaction payload:", JSON.stringify(transactionPayload, null, 2))
        const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction(transactionPayload)
        console.log("Transaction sent successfully with documented format")
        console.log("Command payload:", commandPayload)
        console.log("Final payload:", finalPayload)
        result = finalPayload
        if (finalPayload && typeof finalPayload === "object" && "transaction_id" in finalPayload) {
          transactionId = (finalPayload as any).transaction_id
          console.log("Found transaction_id in finalPayload:", transactionId)
        } else {
          transactionId = extractTransactionId(finalPayload)
        }
        if (transactionId) {
          console.log("Successfully extracted transaction ID:", transactionId)
          return { result, transactionId, reference }
        }
      } catch (docError) {
        console.error("Error with documented format:", docError)
      }
      if (!transactionId) {
        try {
          console.log("Trying simplified transaction format...")
          const simplePayload = {
            transaction: [
              {
                address: contractAddress,
                abi: [
                  {
                    type: "function",
                    name: "claim",
                    inputs: [],
                    outputs: [],
                    stateMutability: "nonpayable",
                  },
                ],
                functionName: "claim",
                args: [],
              },
            ],
          }
          console.log("Simple payload:", JSON.stringify(simplePayload, null, 2))
          const simpleResult = await MiniKit.commandsAsync.sendTransaction(simplePayload)
          console.log("Transaction sent successfully with simplified format:", simpleResult)
          result = simpleResult
          transactionId = extractTransactionId(simpleResult)
          if (transactionId) {
            console.log("Successfully extracted transaction ID from simplified format:", transactionId)
            return { result, transactionId, reference }
          }
        } catch (simpleError) {
          console.error("Error with simplified format:", simpleError)
        }
      }
      if (!transactionId) {
        try {
          console.log("Trying with direct function selector...")
          const selectorPayload = {
            transaction: [
              {
                address: contractAddress,
                abi: [
                  {
                    type: "function",
                    name: "claim",
                    inputs: [],
                    outputs: [],
                    stateMutability: "nonpayable",
                  },
                ],
                functionName: "claim",
                args: [],
              },
            ],
          }
          console.log("Selector payload:", JSON.stringify(selectorPayload, null, 2))
          const selectorResult = await MiniKit.commandsAsync.sendTransaction(selectorPayload)
          result = selectorResult
          transactionId = extractTransactionId(selectorResult)
          if (transactionId) {
            console.log("Successfully extracted transaction ID from selector format:", transactionId)
            return { result, transactionId, reference }
          }
        } catch (selectorError) {
          console.error("Error with function selector format:", selectorError)
        }
      }
      if (!transactionId) {
        try {
          console.log("Trying with callback-based API...")
          const callbackPayload = {
            transaction: [
              {
                address: contractAddress,
                abi: [
                  {
                    type: "function",
                    name: "claim",
                    inputs: [],
                    outputs: [],
                    stateMutability: "nonpayable",
                  },
                ],
                functionName: "claim",
                args: [],
              },
            ],
          }
          const callbackResult = await MiniKit.commandsAsync.sendTransaction(callbackPayload)
          console.log("Transaction sent successfully with callback API:", callbackResult)
          result = callbackResult
          transactionId = extractTransactionId(callbackResult)
          if (transactionId) {
            console.log("Successfully extracted transaction ID from callback API:", transactionId)
            return { result, transactionId, reference }
          }
        } catch (callbackError) {
          console.error("Error with callback API:", callbackError)
        }
      }
      if (!transactionId) {
        try {
          console.log("Trying with direct function selector...")
          const selectorPayload = {
            transaction: [
              {
                to: contractAddress,
                data: "0x379607f5", // Function selector for "claim()"
                value: "0x0",
              },
            ],
          }
          console.log("Selector payload:", JSON.stringify(selectorPayload, null, 2))
          const selectorResult = await MiniKit.commandsAsync.sendTransaction(selectorPayload as any)
          result = selectorResult
          transactionId = extractTransactionId(selectorResult)
          if (transactionId) {
            console.log("Successfully extracted transaction ID from selector format:", transactionId)
            return { result, transactionId, reference }
          }
        } catch (selectorError) {
          console.error("Error with function selector format:", selectorError)
        }
      }
      return { result, transactionId, reference }
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
      // Start the challenge system instead of claiming directly
      setShowChallenge(true)
    } else {
      setSwipePosition(0)
    }

    setSwipeStart(null)
  }

  const handleChallengeComplete = async () => {
    setShowChallenge(false)
    setChallengeCompleted(true)

    // Now proceed with the actual claim
    await handleClaim()
  }

  const handleChallengeCancel = () => {
    setShowChallenge(false)
    setSwipePosition(0)
    setSwipeComplete(false)
  }

  const handleClaim = async () => {
    try {
      trackEvent("claim_started", { userAddress })
      setIsClaiming(true)
      setError(null)
      console.log("Starting claim process for address:", userAddress)

      if (!MiniKit.isInstalled()) {
        throw new Error("MiniKit wallet is not installed. Please install it first.")
      }

      console.log(`Checking claim eligibility for ${userAddress}...`)
      const claimStatus = await fetchUserClaimStatus()

      if (!claimStatus) {
        throw new Error("Failed to check claim eligibility. Please try again.")
      }

      if (!claimStatus.canClaim) {
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

      console.log("Executing MiniKit transaction...")
      try {
        const txResult = await executeMiniKitTransaction()
        console.log("Transaction result:", txResult)
        const { transactionId, reference } = txResult
        if (!transactionId) {
          throw new Error("Failed to get a valid transaction ID. Please try again.")
        }
        console.log("Transaction sent successfully, ID:", transactionId)

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
          }
        } catch (verifyError) {
          console.error("Error during verification:", verifyError)
        }

        console.log("Claim process completed")
        setClaimSuccess(true)
        const nextClaimTimeValue = Date.now() + 24 * 60 * 60 * 1000
        setNextClaimTime(nextClaimTimeValue)
        setCountdownState({
          hours: 24,
          minutes: 0,
          seconds: 0,
        })
        localStorage.setItem(getClaimTimerKey(), nextClaimTimeValue.toString())
        console.log(`Set next claim time to: ${new Date(nextClaimTimeValue).toLocaleString()}`)

        setTimeout(async () => {
          await fetchUserClaimStatus()
        }, 2000)

        trackEvent("claim_success", { userAddress, transactionId })

        setTimeout(() => {
          setClaimSuccess(false)
        }, 3000)
      } catch (txError) {
        console.error("Transaction error:", txError)
        throw txError
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
      setChallengeCompleted(false)
    }
  }

  const formatCountdown = () => {
    if (!nextClaimTime) return { hours: 0, minutes: 0, seconds: 0 }
    const timeLeft = Math.max(0, nextClaimTime - Date.now())
    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
    return { hours, minutes, seconds }
  }

  const countdown = formatCountdown()

  const calculateProgress = () => {
    if (!swipeThreshold || swipePosition === 0) return 0
    return Math.min(100, (swipePosition / swipeThreshold) * 100)
  }

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

  const handleRefreshBalance = () => {
    fetchUserClaimStatus()
  }

  return (
    <div className="flex flex-col items-center justify-between h-full px-4 py-2 overflow-hidden">
      {/* Challenge System Modal */}

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
                <Image src="/logo.png" alt="BlackOps Logo" layout="fill" objectFit="cover" className="rounded-full" />
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

            {/* Challenge completion indicator */}
            {challengeCompleted && (
              <div className="absolute inset-0 rounded-full bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                  <Shield className="w-8 h-8 text-green-400 mb-2" />
                  <span className="text-green-400 font-bold text-sm">Verified!</span>
                </motion.div>
              </div>
            )}

            {/* Countdown overlay when timer is active */}
            {nextClaimTime !== null && (
              <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <Clock className="w-6 h-6 text-amber-400 mb-1 mx-auto" />
                  <div className="text-xl font-bold text-white">
                    {countdownState.hours.toString().padStart(2, "0")}:
                    {countdownState.minutes.toString().padStart(2, "0")}:
                    {countdownState.seconds.toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Next claim available in</div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Status message */}
        <AnimatePresence mode="wait">
          {claimSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center space-x-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full mb-4"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Successfully claimed 6 AVS</span>
            </motion.div>
          ) : (
            <motion.p
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-base font-light mb-4 text-center"
            >
              {nextClaimTime ? (
                <span className="text-gray-400">Next claim available soon</span>
              ) : (
                <span className="text-gray-300">Complete challenges to earn your tokens</span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
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

      {/* Enhanced Swipe to claim UI with challenge indicator */}
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
              <span>Swipe to Start Challenges</span>
              <Star className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Progress bar for swipe */}
        {swipePosition > 0 && (
          <div
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-amber-500/20 to-orange-500/30"
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

      {/* Enhanced Token info with challenge description */}
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
            <h4 className="text-xs font-medium text-amber-400">Earn-to-Claim System</h4>
          </div>
          <p className="text-xs text-gray-300 text-center mb-2">
            Complete skill-based challenges to prove your worth and claim 6 AVS tokens daily.
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>3 Challenges</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>Skill-Based</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
