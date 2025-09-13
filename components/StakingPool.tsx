"use client"
import { motion } from "framer-motion"
import { Lock, Clock, TrendingUp } from "lucide-react"

interface StakingPoolProps {
  userAddress: string
}

export default function StakingPool({ userAddress }: StakingPoolProps) {
  if (!userAddress || userAddress === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="p-4 space-y-4 h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20 text-center"
        >
          <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Wallet Required</h3>
          <p className="text-gray-300 text-sm">Please connect your wallet to access staking</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 h-full flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20 text-center"
      >
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl animate-pulse" />
          <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <Clock className="w-8 h-8 text-white" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Staking Coming Soon</h3>
        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
          We're preparing an exciting staking experience with competitive APY rewards. Stay tuned for the launch!
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-center text-xs text-gray-300">
            <TrendingUp className="w-3 h-3 mr-2 text-purple-400" />
            <span>Up to 25% APY rewards</span>
          </div>
          <div className="flex items-center justify-center text-xs text-gray-300">
            <Lock className="w-3 h-3 mr-2 text-blue-400" />
            <span>Flexible lock periods</span>
          </div>
        </div>

        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full text-sm text-purple-300 border border-purple-500/30">
          <Clock className="w-4 h-4 mr-2" />
          Coming Soon
        </div>
      </motion.div>
    </div>
  )
}
