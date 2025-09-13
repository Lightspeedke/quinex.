"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, CheckCircle, ArrowRight, Info, Twitter } from "lucide-react"
import Image from "next/image"

interface LearnToEarnProps {
  onComplete: () => void
}

export default function LearnToEarn({ onComplete }: LearnToEarnProps) {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [followCompleted, setFollowCompleted] = useState(false)
  const [readCompleted, setReadCompleted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false)
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false)

  const totalSteps = 3

  // Poll question and options
  const pollQuestion = "What is the main purpose of Quinex Token?"
  const pollOptions = [
    "A decentralized payment system",
    "A governance token for the Quinex ecosystem",
    "A store of value like Bitcoin",
    "A meme token with no utility",
  ]

  // The correct answer is the second option (index 1)
  const correctAnswerIndex = 1
  const correctAnswer = pollOptions[correctAnswerIndex]

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // All steps completed
      onComplete()
    }
  }

  const handleFollowComplete = () => {
    setFollowCompleted(true)
  }

  const handleReadComplete = () => {
    setReadCompleted(true)
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
    setShowAnswerFeedback(true)

    // Check if the selected answer is correct
    const isCorrect = answer === correctAnswer
    setIsAnswerCorrect(isCorrect)

    // Only mark as completed if the answer is correct
    if (isCorrect) {
      setQuizCompleted(true)
    } else {
      setQuizCompleted(false)
    }
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return followCompleted
      case 2:
        return readCompleted
      case 3:
        return quizCompleted
      default:
        return false
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="flex justify-between items-center mb-6 px-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep > index + 1 || isStepComplete(index + 1)
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900"
                  : currentStep === index + 1
                    ? "bg-gray-800 border-2 border-amber-500 text-white"
                    : "bg-gray-800 text-gray-500"
              }`}
            >
              {currentStep > index + 1 || isStepComplete(index + 1) ? (
                <CheckCircle size={16} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`h-0.5 w-12 ${
                  currentStep > index + 1 || isStepComplete(index + 1)
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-5 backdrop-blur-sm border border-gray-700/50 shadow-xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Follow on X */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-4">
                <Twitter size={28} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Follow on X</h3>
              <p className="text-gray-300 text-sm text-center mb-4">
                Follow our X account to stay updated with the latest news and announcements.
              </p>

              <a
                href="https://x.com/quinextoken?t=U0Z_OVp_wRXlqUwL5ncVKw&s=08"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-6 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a94e0] transition-colors mb-4 w-full"
                onClick={handleFollowComplete}
              >
                <Twitter size={18} />
                <span className="font-medium">Follow @Quinex</span>
                <ExternalLink size={14} />
              </a>

              <div className="flex items-center mt-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  id="followConfirm"
                  checked={followCompleted}
                  onChange={() => setFollowCompleted(!followCompleted)}
                  className="mr-2 h-4 w-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="followConfirm">I've followed @Quinex on X</label>
              </div>

              <button
                onClick={handleNextStep}
                disabled={!followCompleted}
                className={`mt-6 w-full py-2 px-4 rounded-lg flex items-center justify-center ${
                  followCompleted
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 hover:shadow-lg hover:shadow-amber-500/20"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                } transition-all duration-300`}
              >
                Continue
                <ArrowRight size={16} className="ml-2" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Read about the token */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mr-3">
                  <Image src="/logo.png" width={24} height={24} alt="Anovus Logo" className="rounded-full" />
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  About Quinex Token
                </h3>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 mb-4 max-h-48 overflow-y-auto">
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  Quinex is a next-generation cryptocurrency built on the Worldcoin ecosystem. It aims to provide a
                  secure, fast, and decentralized payment solution while offering governance capabilities to its
                  holders.
                </p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">Key features of Quinex include:</p>
                <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 mb-3">
                  <li>Fast transaction processing with minimal fees</li>
                  <li>Community governance through token voting</li>
                  <li>Enhanced privacy features for secure transactions</li>
                  <li>Seamless integration with the Worldcoin ecosystem</li>
                </ul>
                <p className="text-gray-300 text-sm leading-relaxed">
                  By holding Quinex tokens, you become part of a growing community that's shaping the future of
                  decentralized finance. The token's utility extends beyond simple transactions to include governance
                  voting, staking rewards, and access to exclusive features within the ecosystem.
                </p>
              </div>

              <div className="flex items-center mt-4 text-sm text-gray-400">
                <input
                  type="checkbox"
                  id="readConfirm"
                  checked={readCompleted}
                  onChange={() => setReadCompleted(!readCompleted)}
                  className="mr-2 h-4 w-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="readConfirm">I've read and understood the information about Quinex Token</label>
              </div>

              <button
                onClick={handleNextStep}
                disabled={!readCompleted}
                className={`mt-6 w-full py-2 px-4 rounded-lg flex items-center justify-center ${
                  readCompleted
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 hover:shadow-lg hover:shadow-amber-500/20"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                } transition-all duration-300`}
              >
                Continue
                <ArrowRight size={16} className="ml-2" />
              </button>
            </motion.div>
          )}

          {/* Step 3: Answer a question */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mr-3">
                  <Info size={20} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Quick Question</h3>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 mb-6">
                <p className="text-gray-200 font-medium mb-4">{pollQuestion}</p>

                <div className="space-y-3">
                  {pollOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedAnswer === option
                          ? option === correctAnswer
                            ? "border-green-500 bg-green-500/10 text-white"
                            : "border-red-500 bg-red-500/10 text-white"
                          : "border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                            selectedAnswer === option
                              ? option === correctAnswer
                                ? "border-green-500 bg-green-500"
                                : "border-red-500 bg-red-500"
                              : "border-gray-600"
                          }`}
                        >
                          {selectedAnswer === option && <CheckCircle size={12} className="text-gray-900" />}
                        </div>
                        <span className="text-sm">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Feedback message */}
                {showAnswerFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-3 rounded-lg ${
                      isAnswerCorrect
                        ? "bg-green-500/20 border border-green-500/50"
                        : "bg-red-500/20 border border-red-500/50"
                    }`}
                  >
                    <p className={`text-sm ${isAnswerCorrect ? "text-green-300" : "text-red-300"}`}>
                      {isAnswerCorrect
                        ? "Correct! Quinex is primarily a governance token for the ecosystem."
                        : "That's not correct. Please select the correct answer."}
                    </p>
                  </motion.div>
                )}
              </div>

              <button
                onClick={handleNextStep}
                disabled={!quizCompleted}
                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center ${
                  quizCompleted
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 hover:shadow-lg hover:shadow-amber-500/20"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                } transition-all duration-300`}
              >
                Complete & Claim Tokens
                <ArrowRight size={16} className="ml-2" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step indicator */}
      <div className="mt-4 flex justify-center">
        <p className="text-xs text-gray-400">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  )
}
