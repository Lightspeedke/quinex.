"use client"

import { motion } from "framer-motion"
import { CheckCircle, Clock, Target, Zap } from "lucide-react"

const roadmapItems = [
  {
    quarter: "Q1 2025",
    title: "Staking & Governance",
    description: "Launch staking rewards and DAO governance system",
    status: "upcoming",
    icon: Target,
  },
  {
    quarter: "Q2 2025",
    title: "NFT Marketplace",
    description: "Integrated NFT trading platform using QIX tokens",
    status: "planned",
    icon: Zap,
  },
  {
    quarter: "Q3 2025",
    title: "Cross-Chain Bridge",
    description: "Multi-chain support for QIX token transfers",
    status: "planned",
    icon: Clock,
  },
  {
    quarter: "Q4 2025",
    title: "Merchant Network",
    description: "Real-world payment integration with partner merchants",
    status: "planned",
    icon: CheckCircle,
  },
]

export default function RoadmapSection() {
  return (
    <div className="w-full max-w-md space-y-3">
      <h3 className="text-lg font-bold text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-4">
        Development Roadmap
      </h3>

      {roadmapItems.map((item, index) => (
        <motion.div
          key={item.quarter}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-lg p-3 border border-gray-700/50"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                <span className="text-xs text-amber-400 font-medium">{item.quarter}</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
        <p className="text-xs text-amber-300 text-center">
          🚀 Building the future of decentralized rewards and utility
        </p>
      </div>
    </div>
  )
}
