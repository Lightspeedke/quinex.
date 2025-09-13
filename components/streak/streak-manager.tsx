"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Flame, AlertTriangle, Clock, Award, Star, Crown, Trophy, Zap, Shield, Cloud } from "lucide-react"
import { streakStorage } from "./streak-storage"
import { BackupModal } from "./backup-modal"

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastClaimDate: string
  totalClaims: number
  badges: Badge[]
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  requirement: number
  earned: boolean
  earnedDate?: string
}

interface StreakManagerProps {
  userAddress: string
  onStreakUpdate?: (streakData: StreakData) => void
}

const STREAK_BADGES: Omit<Badge, "earned" | "earnedDate">[] = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first daily claim",
    icon: "star",
    color: "from-gray-400 to-gray-600",
    requirement: 1,
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Maintain a 3-day streak",
    icon: "flame",
    color: "from-orange-400 to-red-500",
    requirement: 3,
  },
  {
    id: "weekly_warrior",
    name: "Weekly Warrior",
    description: "Achieve a 7-day streak",
    icon: "shield",
    color: "from-blue-400 to-blue-600",
    requirement: 7,
  },
  {
    id: "dedicated_user",
    name: "Dedicated User",
    description: "Reach a 14-day streak",
    icon: "award",
    color: "from-green-400 to-green-600",
    requirement: 14,
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Maintain a 30-day streak",
    icon: "trophy",
    color: "from-yellow-400 to-orange-500",
    requirement: 30,
  },
  {
    id: "consistency_king",
    name: "Consistency King",
    description: "Achieve a 60-day streak",
    icon: "crown",
    color: "from-purple-400 to-pink-500",
    requirement: 60,
  },
  {
    id: "century_achiever",
    name: "Century Achiever",
    description: "Reach the legendary 100-day streak",
    icon: "zap",
    color: "from-amber-400 via-yellow-400 to-orange-500",
    requirement: 100,
  },
  {
    id: "streak_legend",
    name: "Streak Legend",
    description: "The ultimate 365-day streak",
    icon: "crown",
    color: "from-purple-500 via-pink-500 to-red-500",
    requirement: 365,
  },
]

export function StreakManager({ userAddress, onStreakUpdate }: StreakManagerProps) {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastClaimDate: "",
    totalClaims: 0,
    badges: STREAK_BADGES.map((badge) => ({ ...badge, earned: false })),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showWarning, setShowWarning] = useState(false)
  const [timeUntilBreak, setTimeUntilBreak] = useState<string>("")
  const [newBadge, setNewBadge] = useState<Badge | null>(null)
  const [showBadges, setShowBadges] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)

  const getStreakStorageKey = () => `streak_data_${userAddress}`

  // Load streak data from localStorage
  useEffect(() => {
    if (!userAddress) return

    const loadData = async () => {
      try {
        const stored = await streakStorage.loadStreak(userAddress)
        if (stored) {
          // Ensure badges array exists and is up to date
          const updatedBadges = STREAK_BADGES.map((templateBadge) => {
            const existingBadge = stored.badges?.find((b: Badge) => b.id === templateBadge.id)
            return existingBadge || { ...templateBadge, earned: false }
          })
          setStreakData({ ...stored, badges: updatedBadges })
        }
      } catch (error) {
        console.error("Error loading streak data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userAddress])

  // Save streak data to localStorage
  const saveStreakData = async (data: StreakData) => {
    try {
      await streakStorage.saveStreak(userAddress, data)
      setStreakData(data)
      onStreakUpdate?.(data)
    } catch (error) {
      console.error("Error saving streak data:", error)
    }
  }

  // Check if today is consecutive to last claim
  const isConsecutiveDay = (lastDate: string): boolean => {
    if (!lastDate) return true

    const last = new Date(lastDate)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    last.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    yesterday.setHours(0, 0, 0, 0)

    return last.getTime() === yesterday.getTime()
  }

  // Check if user already claimed today
  const hasClaimedToday = (lastDate: string): boolean => {
    if (!lastDate) return false

    const last = new Date(lastDate)
    const today = new Date()

    last.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    return last.getTime() === today.getTime()
  }

  // Check for new badges earned
  const checkForNewBadges = (currentStreak: number, newData: StreakData) => {
    const newlyEarnedBadges = newData.badges.filter((badge) => {
      return !badge.earned && currentStreak >= badge.requirement
    })

    if (newlyEarnedBadges.length > 0) {
      // Award the highest milestone badge earned
      const highestBadge = newlyEarnedBadges.reduce((prev, current) =>
        prev.requirement > current.requirement ? prev : current,
      )

      const updatedBadges = newData.badges.map((badge) =>
        badge.id === highestBadge.id ? { ...badge, earned: true, earnedDate: new Date().toISOString() } : badge,
      )

      const finalData = { ...newData, badges: updatedBadges }

      // Set the new badge to show modal
      setNewBadge({ ...highestBadge, earned: true, earnedDate: new Date().toISOString() })

      return finalData
    }

    return newData
  }

  // Check if streak is at risk
  const checkStreakRisk = () => {
    if (!streakData.lastClaimDate || streakData.currentStreak === 0) {
      setShowWarning(false)
      return
    }

    const lastClaim = new Date(streakData.lastClaimDate)
    const now = new Date()
    const today = new Date()

    lastClaim.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const isLastClaimYesterday = lastClaim.getTime() === yesterday.getTime()
    const hasClaimedToday = lastClaim.getTime() === today.getTime()

    if (isLastClaimYesterday && !hasClaimedToday && streakData.currentStreak > 0) {
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      const timeLeft = endOfDay.getTime() - now.getTime()
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

      if (hoursLeft < 6) {
        setShowWarning(true)
        setTimeUntilBreak(`${hoursLeft}h ${minutesLeft}m`)
      } else {
        setShowWarning(false)
      }
    } else {
      setShowWarning(false)
    }
  }

  // Check streak risk every minute
  useEffect(() => {
    checkStreakRisk()
    const interval = setInterval(checkStreakRisk, 60000)
    return () => clearInterval(interval)
  }, [streakData])

  // Get streak title based on streak count
  const getStreakTitle = (streak: number) => {
    if (streak >= 365) return "Legend"
    if (streak >= 100) return "Master"
    if (streak >= 30) return "Expert"
    if (streak >= 7) return "Regular"
    if (streak >= 3) return "Starter"
    return "Newcomer"
  }

  // Get badge icon component
  const getBadgeIcon = (iconName: string) => {
    const iconProps = { className: "w-4 h-4" }
    switch (iconName) {
      case "star":
        return <Star {...iconProps} />
      case "flame":
        return <Flame {...iconProps} />
      case "shield":
        return <Shield {...iconProps} />
      case "award":
        return <Award {...iconProps} />
      case "trophy":
        return <Trophy {...iconProps} />
      case "crown":
        return <Crown {...iconProps} />
      case "zap":
        return <Zap {...iconProps} />
      default:
        return <Award {...iconProps} />
    }
  }

  // Get earned badges count
  const earnedBadgesCount = streakData.badges.filter((badge) => badge.earned).length

  // Handle closing the badge modal
  const closeBadgeModal = () => {
    console.log("Closing badge modal")
    setNewBadge(null)
  }

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeBadgeModal()
    }
  }

  // Expose methods for parent component
  useEffect(() => {
    const streakManager = {
      updateStreak: () => {
        const today = new Date().toISOString().split("T")[0]

        if (hasClaimedToday(streakData.lastClaimDate)) {
          console.log("Already claimed today, no streak update")
          return streakData
        }

        let newStreak = streakData.currentStreak

        if (isConsecutiveDay(streakData.lastClaimDate)) {
          newStreak += 1
        } else {
          newStreak = 1
        }

        const newData: StreakData = {
          ...streakData,
          currentStreak: newStreak,
          longestStreak: Math.max(streakData.longestStreak, newStreak),
          lastClaimDate: today,
          totalClaims: streakData.totalClaims + 1,
        }

        // Check for new badges and save
        const finalData = checkForNewBadges(newStreak, newData)
        saveStreakData(finalData)
        return finalData
      },
      getStreakMultiplier: () => {
        if (streakData.currentStreak >= 100) return 5
        if (streakData.currentStreak >= 30) return 3
        if (streakData.currentStreak >= 7) return 2
        return 1
      },
      hasClaimedToday: () => hasClaimedToday(streakData.lastClaimDate),
    }
    ;(window as any).streakManager = streakManager
  }, [streakData])

  if (isLoading) {
    return (
      <div className="w-full bg-gray-800/60 rounded-lg p-2 backdrop-blur-sm border border-gray-700/50 mb-2">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="h-3 bg-gray-600 rounded flex-1"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mb-2">
      {/* Streak Warning Banner */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-red-900/80 to-orange-900/80 border border-red-700/50 rounded-lg p-2 mb-2 backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </motion.div>
              <div className="flex-1">
                <p className="text-red-300 text-xs font-medium">⚠️ Streak at risk! Claim within {timeUntilBreak}</p>
                <p className="text-red-400/80 text-xs">Don't lose your {streakData.currentStreak}-day streak!</p>
              </div>
              <Clock className="w-4 h-4 text-red-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Streak Display */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`w-full rounded-lg p-2 backdrop-blur-sm shadow-md transition-all duration-300 ${
          showWarning ? "bg-red-900/20 border border-red-700/50" : "bg-gray-800/80 border border-gray-700/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <motion.div
              animate={
                showWarning
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, -2, 2, 0],
                    }
                  : {}
              }
              transition={{
                duration: 0.5,
                repeat: showWarning ? Number.POSITIVE_INFINITY : 0,
                repeatType: "reverse",
              }}
            >
              {streakData.currentStreak > 0 ? (
                <Flame
                  className={`w-4 h-4 ${
                    showWarning ? "text-red-400" : streakData.currentStreak >= 7 ? "text-amber-400" : "text-gray-400"
                  }`}
                />
              ) : (
                <Calendar className="w-4 h-4 text-gray-400" />
              )}
            </motion.div>
            <div>
              <h3 className={`text-sm font-bold ${showWarning ? "text-red-300" : "text-white"}`}>Daily Streak</h3>
              <p className={`text-xs ${showWarning ? "text-red-400/80" : "text-gray-400"}`}>
                {getStreakTitle(streakData.currentStreak)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-center">
              <motion.div
                className={`text-xl font-bold ${showWarning ? "text-red-300" : "text-white"}`}
                animate={showWarning ? { scale: [1, 1.05, 1] } : {}}
                transition={{
                  duration: 1,
                  repeat: showWarning ? Number.POSITIVE_INFINITY : 0,
                  repeatType: "reverse",
                }}
              >
                {streakData.currentStreak}
              </motion.div>
              <div className={`text-xs ${showWarning ? "text-red-400/80" : "text-gray-400"}`}>days</div>
            </div>

            <div className="text-center">
              <div className={`text-sm font-medium ${showWarning ? "text-red-300/80" : "text-gray-300"}`}>
                {streakData.longestStreak}
              </div>
              <div className={`text-xs ${showWarning ? "text-red-400/80" : "text-gray-400"}`}>best</div>
            </div>

            {/* Badge Count */}
            <div className="flex items-center space-x-1">
              <motion.button
                onClick={() => setShowBadges(!showBadges)}
                className="flex items-center space-x-1 bg-amber-500/20 border border-amber-500/30 rounded-lg px-2 py-1 hover:bg-amber-500/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Award className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">{earnedBadgesCount}</span>
              </motion.button>

              <motion.button
                onClick={() => setShowBackupModal(true)}
                className="flex items-center space-x-1 bg-blue-500/20 border border-blue-500/30 rounded-lg px-2 py-1 hover:bg-blue-500/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Backup & Restore"
              >
                <Cloud className="w-3 h-3 text-blue-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Badges Display */}
        <AnimatePresence>
          {showBadges && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 border-t border-gray-700/50"
            >
              <h4 className="text-xs font-bold text-white mb-2">Achievement Badges</h4>
              <div className="grid grid-cols-4 gap-2">
                {streakData.badges.slice(0, 8).map((badge) => (
                  <motion.div
                    key={badge.id}
                    className={`relative p-2 rounded-lg border text-center transition-all ${
                      badge.earned
                        ? `bg-gradient-to-br ${badge.color} border-white/20`
                        : "bg-gray-700/30 border-gray-600/30"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    title={badge.description}
                  >
                    <div className={`${badge.earned ? "text-white" : "text-gray-500"}`}>{getBadgeIcon(badge.icon)}</div>
                    <p className={`text-xs mt-1 ${badge.earned ? "text-white" : "text-gray-500"}`}>
                      {badge.requirement}
                    </p>
                    {badge.earned && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* New Badge Modal */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-700/50 shadow-xl text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Celebration particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-amber-400 rounded-full"
                    initial={{
                      x: "50%",
                      y: "50%",
                      scale: 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 200}%`,
                      y: `${50 + (Math.random() - 0.5) * 200}%`,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 0.5,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>

              {/* Badge Display */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: [0, 1.3, 1], rotate: [0, 360, 0] }}
                transition={{ duration: 1, times: [0, 0.6, 1] }}
                className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${newBadge.color} rounded-full flex items-center justify-center relative border-4 border-white/20`}
              >
                <div className="text-white">{getBadgeIcon(newBadge.icon)}</div>
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
              </motion.div>

              <motion.h3
                className="text-xl font-black text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                🏆 Badge Earned!
              </motion.h3>

              <motion.p
                className="text-amber-300 font-bold text-lg mb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {newBadge.name}
              </motion.p>

              <motion.p
                className="text-gray-300 text-sm mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {newBadge.description}
              </motion.p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeBadgeModal}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                🎉 Awesome!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Backup Modal */}
      <BackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        userAddress={userAddress}
        onRestore={() => {
          // Reload the component to show restored data
          window.location.reload()
        }}
      />
    </div>
  )
}
