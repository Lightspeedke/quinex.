"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Brain, Calculator, Puzzle, Target, Zap, Clock, Star } from "lucide-react"

interface Challenge {
  id: string
  type: "math" | "pattern" | "memory" | "sequence"
  question: string
  options?: string[]
  correctAnswer: string | number
  difficulty: "easy" | "medium" | "hard"
}

interface ChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onFail: () => void
}

const generateMathChallenge = (): Challenge => {
  const operations = ["+", "-", "*"]
  const operation = operations[Math.floor(Math.random() * operations.length)]

  let num1: number, num2: number, answer: number

  switch (operation) {
    case "+":
      num1 = Math.floor(Math.random() * 50) + 1
      num2 = Math.floor(Math.random() * 50) + 1
      answer = num1 + num2
      break
    case "-":
      num1 = Math.floor(Math.random() * 50) + 25
      num2 = Math.floor(Math.random() * 25) + 1
      answer = num1 - num2
      break
    case "*":
      num1 = Math.floor(Math.random() * 12) + 1
      num2 = Math.floor(Math.random() * 12) + 1
      answer = num1 * num2
      break
    default:
      num1 = 5
      num2 = 3
      answer = 8
  }

  return {
    id: "math-1",
    type: "math",
    question: `What is ${num1} ${operation} ${num2}?`,
    correctAnswer: answer,
    difficulty: "easy",
  }
}

const generatePatternChallenge = (): Challenge => {
  const patterns = [
    { sequence: [1, 2, 4, 8, "?"], answer: 16, question: "Complete the pattern: 1, 2, 4, 8, ?" },
    { sequence: [2, 4, 6, 8, "?"], answer: 10, question: "Complete the pattern: 2, 4, 6, 8, ?" },
    { sequence: [1, 1, 2, 3, 5, "?"], answer: 8, question: "Complete the Fibonacci sequence: 1, 1, 2, 3, 5, ?" },
    { sequence: [10, 9, 7, 4, "?"], answer: 0, question: "Complete the pattern: 10, 9, 7, 4, ?" },
    { sequence: [3, 6, 12, 24, "?"], answer: 48, question: "Complete the pattern: 3, 6, 12, 24, ?" },
  ]

  const pattern = patterns[Math.floor(Math.random() * patterns.length)]

  return {
    id: "pattern-1",
    type: "pattern",
    question: pattern.question,
    correctAnswer: pattern.answer,
    difficulty: "medium",
  }
}

const generateMemoryChallenge = (): Challenge => {
  const colors = ["🔴", "🟡", "🟢", "🔵", "🟣", "🟠", "⚫", "⚪"]
  const sequence = []
  const length = 4 + Math.floor(Math.random() * 3) // 4-6 items

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)])
  }

  const sequenceString = sequence.join(" ")

  return {
    id: "memory-1",
    type: "memory",
    question: `Memorize this sequence: ${sequenceString}`,
    correctAnswer: sequenceString,
    difficulty: "hard",
  }
}

const generateSequenceChallenge = (): Challenge => {
  const sequences = [
    { question: "What comes next in the alphabet: A, C, E, G, ?", answer: "I" },
    { question: "Complete: Monday, Wednesday, Friday, ?", answer: "Sunday" },
    { question: "What's the next prime number after 7?", answer: "11" },
    { question: "Complete: Spring, Summer, Fall, ?", answer: "Winter" },
    { question: "What comes next: 2, 6, 18, 54, ?", answer: "162" },
  ]

  const seq = sequences[Math.floor(Math.random() * sequences.length)]

  return {
    id: "sequence-1",
    type: "sequence",
    question: seq.question,
    correctAnswer: seq.answer,
    difficulty: "medium",
  }
}

export function ChallengeModal({ isOpen, onClose, onSuccess, onFail }: ChallengeModalProps) {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [showSequence, setShowSequence] = useState(true)
  const [timeLeft, setTimeLeft] = useState(45)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [challengeStarted, setChallengeStarted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      generateNewChallenge()
      setTimeLeft(45)
      setUserAnswer("")
      setFeedback(null)
      setChallengeStarted(true)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && timeLeft > 0 && !feedback && challengeStarted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !feedback && challengeStarted) {
      handleTimeout()
    }
  }, [isOpen, timeLeft, feedback, challengeStarted])

  useEffect(() => {
    if (currentChallenge?.type === "memory" && showSequence && isOpen) {
      const timer = setTimeout(() => {
        setShowSequence(false)
        setTimeout(() => {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement
          if (input) input.focus()
        }, 100)
      }, 4000) // Increased to 4 seconds
      return () => clearTimeout(timer)
    }
  }, [currentChallenge, showSequence, isOpen])

  const generateNewChallenge = () => {
    const challengeTypes = [
      generateMathChallenge,
      generatePatternChallenge,
      generateMemoryChallenge,
      generateSequenceChallenge,
    ]
    const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)]
    const challenge = randomType()
    setCurrentChallenge(challenge)
    setShowSequence(true)
  }

  const handleTimeout = () => {
    setFeedback({ type: "error", message: "⏰ Time's up! Challenge failed." })
    setTimeout(() => {
      onFail()
    }, 2500)
  }

  const handleSubmit = async () => {
    if (!currentChallenge || !userAnswer.trim()) return

    setIsSubmitting(true)

    // Simulate processing time with visual feedback
    await new Promise((resolve) => setTimeout(resolve, 1200))

    let isCorrect = false
    const userAnswerClean = userAnswer.toLowerCase().trim()
    const correctAnswerClean = currentChallenge.correctAnswer.toString().toLowerCase().trim()

    if (currentChallenge.type === "memory") {
      const userSequence = userAnswerClean.replace(/\s+/g, "")
      const correctSequence = correctAnswerClean.replace(/\s+/g, "")
      isCorrect = userSequence === correctSequence
    } else {
      isCorrect = userAnswerClean === correctAnswerClean
    }

    if (isCorrect) {
      setFeedback({ type: "success", message: "🎉 Excellent! Challenge completed!" })
      setTimeout(() => {
        onSuccess()
      }, 2500)
    } else {
      setFeedback({
        type: "error",
        message: `❌ Incorrect. The answer was: ${currentChallenge.correctAnswer}`,
      })
      setTimeout(() => {
        onFail()
      }, 3000)
    }

    setIsSubmitting(false)
  }

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "math":
        return <Calculator className="w-7 h-7" />
      case "pattern":
        return <Puzzle className="w-7 h-7" />
      case "memory":
        return <Brain className="w-7 h-7" />
      case "sequence":
        return <Target className="w-7 h-7" />
      default:
        return <Brain className="w-7 h-7" />
    }
  }

  const getChallengeColor = (type: string) => {
    switch (type) {
      case "math":
        return "from-blue-500 to-cyan-500"
      case "pattern":
        return "from-purple-500 to-pink-500"
      case "memory":
        return "from-green-500 to-emerald-500"
      case "sequence":
        return "from-orange-500 to-red-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400 bg-green-500/20"
      case "medium":
        return "text-yellow-400 bg-yellow-500/20"
      case "hard":
        return "text-red-400 bg-red-500/20"
      default:
        return "text-gray-400 bg-gray-500/20"
    }
  }

  const getTimeColor = () => {
    if (timeLeft > 30) return "text-green-400 bg-green-500/20"
    if (timeLeft > 15) return "text-yellow-400 bg-yellow-500/20"
    return "text-red-400 bg-red-500/20"
  }

  if (!isOpen || !currentChallenge) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-700/50 shadow-2xl relative overflow-hidden"
        >
          {/* Animated background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${getChallengeColor(currentChallenge.type)} opacity-5`} />

          {/* Header */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center space-x-3">
              <motion.div
                className={`p-3 bg-gradient-to-br ${getChallengeColor(currentChallenge.type)} rounded-2xl shadow-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-white">{getChallengeIcon(currentChallenge.type)}</div>
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Security Challenge</h3>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(currentChallenge.difficulty)}`}
                  >
                    {currentChallenge.difficulty.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400 capitalize">{currentChallenge.type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.div
                className={`flex items-center space-x-1 px-3 py-2 rounded-full ${getTimeColor()}`}
                animate={timeLeft <= 10 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Number.POSITIVE_INFINITY : 0 }}
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm font-mono font-bold">{timeLeft}s</span>
              </motion.div>
              <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Challenge Content */}
          <div className="mb-6 relative z-10">
            {currentChallenge.type === "memory" && showSequence ? (
              <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-gray-300 mb-4 font-medium">Memorize this sequence:</p>
                <motion.div
                  className="text-4xl mb-6 p-6 bg-gradient-to-br from-gray-700/80 to-gray-800/80 rounded-2xl font-mono border border-gray-600/50 shadow-inner"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  {currentChallenge.question.split(": ")[1]}
                </motion.div>
                <div className="flex items-center justify-center space-x-2 text-amber-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Zap className="w-4 h-4" />
                  </motion.div>
                  <p className="text-sm font-medium">Sequence will disappear in 4 seconds...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p className="text-gray-300 mb-6 text-center font-medium text-lg">
                  {currentChallenge.type === "memory"
                    ? "Enter the sequence you memorized (with spaces):"
                    : currentChallenge.question}
                </p>

                <motion.input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={currentChallenge.type === "memory" ? "🔴 🟡 🟢..." : "Enter your answer..."}
                  className="w-full p-4 bg-gradient-to-br from-gray-700/80 to-gray-800/80 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-center text-lg font-medium"
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSubmitting && userAnswer.trim()) {
                      handleSubmit()
                    }
                  }}
                  autoFocus={!showSequence}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>
            )}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`mb-6 p-4 rounded-2xl flex items-center space-x-3 relative z-10 ${
                  feedback.type === "success"
                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
                    : "bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30"
                }`}
              >
                <motion.div
                  animate={feedback.type === "success" ? { rotate: [0, 360] } : { x: [-5, 5, -5, 5, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}
                </motion.div>
                <span
                  className={`text-sm font-medium ${feedback.type === "success" ? "text-green-300" : "text-red-300"}`}
                >
                  {feedback.message}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          {!showSequence && !feedback && (
            <motion.button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold rounded-2xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isSubmitting && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center space-x-2">
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5" />
                    <span>Submit Answer</span>
                  </>
                )}
              </div>
            </motion.button>
          )}

          {/* Instructions */}
          <motion.div
            className="mt-6 p-4 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl border border-gray-700/30 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              🛡️ Complete this security challenge to verify you're human and earn your daily tokens.
              <br />
              <span className="text-amber-400 font-medium">Time remaining: {timeLeft} seconds</span>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
