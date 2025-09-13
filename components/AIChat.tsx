"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, AlertCircle, Sparkles } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

interface LearnedData {
  userQuestions: string[]
  commonTopics: { [key: string]: number }
  lastUpdated: Date
}

interface AIChatProps {
  userAddress: string
}

export default function AIChat({ userAddress }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dailyMessageCount, setDailyMessageCount] = useState(0)
  const [lastResetDate, setLastResetDate] = useState<string>("")
  const [learnedData, setLearnedData] = useState<LearnedData>({
    userQuestions: [],
    commonTopics: {},
    lastUpdated: new Date(),
  })
  const MAX_DAILY_MESSAGES = 5

  const learnFromMessage = (userMessage: string) => {
    const keywords = [
      "defi",
      "staking",
      "governance",
      "nft",
      "token",
      "reward",
      "vote",
      "claim",
      "swap",
      "worldcoin",
      "quinex",
      "qnx",
    ]

    setLearnedData((prev) => {
      const newData = { ...prev }

      // Store user question
      newData.userQuestions.push(userMessage.toLowerCase())

      // Analyze topics
      keywords.forEach((keyword) => {
        if (userMessage.toLowerCase().includes(keyword)) {
          newData.commonTopics[keyword] = (newData.commonTopics[keyword] || 0) + 1
        }
      })

      newData.lastUpdated = new Date()

      // Save to localStorage
      localStorage.setItem(`ai_learned_data_${userAddress}`, JSON.stringify(newData))

      return newData
    })
  }

  const generateSmartResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    // Check for common topics from learned data
    const topTopics = Object.entries(learnedData.commonTopics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic)

    // Enhanced responses based on learning
    if (message.includes("staking") || message.includes("stake")) {
      return `Great question about staking! Based on what I've learned from users, staking is very popular. Quinex offers staking pools with up to 25% APY. You can stake your QNX tokens to earn passive rewards. ${topTopics.includes("staking") ? "Many users are interested in staking - you're in good company!" : ""}`
    }

    if (message.includes("governance") || message.includes("vote")) {
      return `Governance voting is essential for Quinex's decentralized future! Each vote is secured with onchain signatures, and you don't need any QNX tokens to participate. ${topTopics.includes("governance") ? "I've noticed governance is a trending topic among users!" : ""}`
    }

    if (message.includes("nft")) {
      return `Our NFT marketplace features exclusive collections for early adopters! You can claim free NFTs by signing onchain messages. ${topTopics.includes("nft") ? "NFTs are quite popular among our community!" : ""}`
    }

    if (message.includes("worldcoin") || message.includes("world")) {
      return `Worldcoin integration ensures secure, fast, and low-cost transactions for all Quinex operations. We're built on World Chain for optimal performance! ${topTopics.includes("worldcoin") ? "World Chain questions are trending!" : ""}`
    }

    if (message.includes("token") || message.includes("qnx")) {
      return `The Quinex token (QNX) is used for governance, staking rewards, and accessing premium features. You can earn QNX through daily claims, staking, and governance participation! ${topTopics.includes("token") ? "Token questions are very common!" : ""}`
    }

    if (message.includes("reward") || message.includes("claim")) {
      return `You can earn rewards through daily claims, staking pools, governance participation, and completing tasks. Rewards are distributed automatically! ${topTopics.includes("reward") ? "Rewards are a hot topic among users!" : ""}`
    }

    // Default responses with learning context
    const defaultResponses = [
      `That's an interesting question! ${learnedData.userQuestions.length > 10 ? `I've learned from ${learnedData.userQuestions.length} user questions so far.` : ""} Quinex offers comprehensive DeFi solutions including staking, governance, and NFTs.`,
      `Thanks for asking! ${topTopics.length > 0 ? `Popular topics recently include: ${topTopics.join(", ")}.` : ""} I'm here to help with any Quinex-related questions.`,
      `Great question! Based on user interactions, I can help you with staking (up to 25% APY), governance voting, NFT claiming, and token rewards.`,
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  // Initialize daily message count and load learned data
  useEffect(() => {
    const today = new Date().toDateString()
    const storedDate = localStorage.getItem(`ai_chat_date_${userAddress}`)
    const storedCount = localStorage.getItem(`ai_chat_count_${userAddress}`)

    if (storedDate === today) {
      setDailyMessageCount(Number.parseInt(storedCount || "0", 10))
    } else {
      // Reset count for new day
      setDailyMessageCount(0)
      localStorage.setItem(`ai_chat_date_${userAddress}`, today)
      localStorage.setItem(`ai_chat_count_${userAddress}`, "0")
    }
    setLastResetDate(today)

    const savedLearnedData = localStorage.getItem(`ai_learned_data_${userAddress}`)
    if (savedLearnedData) {
      const parsedData = JSON.parse(savedLearnedData)
      setLearnedData({
        ...parsedData,
        lastUpdated: new Date(parsedData.lastUpdated),
      })
    }

    // Load previous messages
    const savedMessages = localStorage.getItem(`ai_chat_messages_${userAddress}`)
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }))
      setMessages(parsedMessages)
    } else {
      // Add welcome message
      const welcomeMessage: Message = {
        id: "welcome",
        content:
          "Hello! I'm your AI assistant for Quinex. I learn from our conversations to provide better help. I can assist with DeFi, staking, governance, and our platform. You have 5 free messages per day!",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [userAddress])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai_chat_messages_${userAddress}`, JSON.stringify(messages))
    }
  }, [messages, userAddress])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    if (dailyMessageCount >= MAX_DAILY_MESSAGES) {
      const limitMessage: Message = {
        id: `limit-${Date.now()}`,
        content: "You've reached your daily limit of 5 messages. More messages coming soon! Please try again tomorrow.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, limitMessage])
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    learnFromMessage(inputMessage)

    setInputMessage("")
    setIsLoading(true)

    // Increment message count
    const newCount = dailyMessageCount + 1
    setDailyMessageCount(newCount)
    localStorage.setItem(`ai_chat_count_${userAddress}`, newCount.toString())

    setTimeout(() => {
      const smartResponse = generateSmartResponse(inputMessage)

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: smartResponse,
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-500/20 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-5 h-5 text-blue-400 mr-2" />
            <h3 className="text-lg font-bold text-white">AI Assistant</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Daily Messages</p>
            <p className="text-sm font-bold text-blue-400">
              {dailyMessageCount}/{MAX_DAILY_MESSAGES}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-300 mt-2">
          I learn from our conversations! Ask me about Quinex, DeFi, staking, or governance.
          {learnedData.userQuestions.length > 0 && (
            <span className="text-blue-400 ml-1">({learnedData.userQuestions.length} questions learned)</span>
          )}
        </p>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-xl ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900"
                    : "bg-gray-800/50 text-gray-200 border border-gray-700/50"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === "ai" && <Bot className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />}
                  {message.sender === "user" && <User className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender === "user" ? "text-gray-700" : "text-gray-400"}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="bg-gray-800/50 text-gray-200 border border-gray-700/50 p-3 rounded-xl">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
        {dailyMessageCount >= MAX_DAILY_MESSAGES ? (
          <div className="flex items-center justify-center p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
            <AlertCircle className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-400">Daily limit reached. More messages coming soon!</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about Quinex..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm"
              disabled={isLoading}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <div className="flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            <span>Powered by AI</span>
          </div>
          <span>{MAX_DAILY_MESSAGES - dailyMessageCount} messages remaining today</span>
        </div>
      </div>
    </div>
  )
}
