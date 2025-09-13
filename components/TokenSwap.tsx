"use client"

import { motion } from "framer-motion"

interface TokenSwapProps {
  userAddress?: string
}

export default function TokenSwap({ userAddress }: TokenSwapProps) {
  return (
    <div className="p-4 space-y-4 h-full flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-900/30 to-teal-900/30 rounded-xl p-8 border border-blue-500/20 text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔄</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Token Swap</h2>
          <p className="text-gray-300 text-lg mb-6">Coming Soon</p>
          <p className="text-gray-400 text-sm">
            We're working hard to bring you the best token swapping experience. Stay tuned for updates!
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={true}
          className="w-full py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300 cursor-not-allowed"
        >
          <span>🚀 Swap Coming Soon</span>
        </motion.button>
      </motion.div>
    </div>
  )
}
