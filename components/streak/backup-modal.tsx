"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Upload, Copy, Check, X, Shield, AlertCircle, Cloud } from "lucide-react"
import { streakStorage } from "./streak-storage"

interface BackupModalProps {
  isOpen: boolean
  onClose: () => void
  userAddress: string
  onRestore: () => void
}

export function BackupModal({ isOpen, onClose, userAddress, onRestore }: BackupModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export")
  const [backupCode, setBackupCode] = useState("")
  const [importCode, setImportCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleExport = async () => {
    try {
      setExporting(true)
      const backup = await streakStorage.exportBackup(userAddress)
      setBackupCode(backup)
      setMessage({ type: "success", text: "Backup code generated successfully!" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create backup. No streak data found." })
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    if (!importCode.trim()) {
      setMessage({ type: "error", text: "Please enter a backup code" })
      return
    }

    try {
      setImporting(true)
      const result = await streakStorage.importBackup(importCode.trim())

      if (result.success) {
        setMessage({ type: "success", text: "Streak data restored successfully!" })
        setTimeout(() => {
          onRestore()
          onClose()
        }, 1500)
      } else {
        setMessage({ type: "error", text: "Invalid backup code. Please check and try again." })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to restore backup. Invalid format." })
    } finally {
      setImporting(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(backupCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = backupCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700/50 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Cloud className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Streak Backup</h3>
                <p className="text-xs text-gray-400">Protect your streak data</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-800/50 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab("export")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "export" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "import" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Import
            </button>
          </div>

          {/* Export Tab */}
          {activeTab === "export" && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-amber-300 text-sm font-medium">Important!</p>
                    <p className="text-amber-200/80 text-xs mt-1">
                      Save this backup code safely. You'll need it to restore your streak if you reinstall the app.
                    </p>
                  </div>
                </div>
              </div>

              {!backupCode ? (
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {exporting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Generate Backup Code</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Your Backup Code:</p>
                    <div className="bg-gray-900/50 rounded p-2 font-mono text-xs text-green-400 break-all">
                      {backupCode}
                    </div>
                  </div>

                  <button
                    onClick={copyToClipboard}
                    className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Import Tab */}
          {activeTab === "import" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Restore Streak</p>
                    <p className="text-blue-200/80 text-xs mt-1">
                      Enter your backup code to restore your streak data. This will overwrite any existing data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Backup Code</label>
                  <textarea
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    placeholder="Paste your backup code here..."
                    className="w-full h-24 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-xs resize-none"
                  />
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing || !importCode.trim()}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {importing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Restore Streak Data</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                  message.type === "success"
                    ? "bg-green-500/20 border border-green-500/30 text-green-300"
                    : "bg-red-500/20 border border-red-500/30 text-red-300"
                }`}
              >
                {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-sm">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
