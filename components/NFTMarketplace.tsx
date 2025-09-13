"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ImageIcon, Star, Users, AlertCircle, CheckCircle, Lock } from "lucide-react"
import { MiniKit, type SignMessageInput } from "@worldcoin/minikit-js"

interface NFT {
  id: string
  name: string
  image: string
  price: number
  priceInWLD: number
  rarity: "common" | "rare" | "epic" | "legendary"
  creator: string
  likes: number
  contractAddress: string
  tokenId: string
  isEarlyAdopter?: boolean // Added early adopter flag
  isClaimed?: boolean // Added claimed status
}

interface NFTMarketplaceProps {
  userAddress: string
}

const NFT_MARKETPLACE_CONTRACT = "0xB5aC9f8191aDd0CDB81bac29510D4c6Eef82dc95" // Updated to real receiving address
const WLD_TOKEN_CONTRACT = "0x163f8c2467924be0ae7b5347228cabf260318753" // WLD token on World Chain

export default function NFTMarketplace({ userAddress }: NFTMarketplaceProps) {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [reservedBalance, setReservedBalance] = useState(0)
  const [wldBalance, setWldBalance] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [claimingNFT, setClaimingNFT] = useState<string | null>(null) // Changed from purchasing to claiming
  const [claimError, setClaimError] = useState<string | null>(null) // Changed from purchase to claim error
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null) // Changed from purchase to claim success

  const fetchMarketplaceData = async () => {
    try {
      const balance = localStorage.getItem(`balance_${userAddress}`) || "1250"
      setReservedBalance(Number.parseFloat(balance)) // Set reserved balance

      try {
        const response = await fetch(`/api/wallet-tokens?address=${userAddress}`)
        if (response.ok) {
          const data = await response.json()
          const wldToken = data.tokens?.find(
            (token: any) =>
              token.symbol === "WLD" || token.contractAddress.toLowerCase() === WLD_TOKEN_CONTRACT.toLowerCase(),
          )
          setWldBalance(wldToken ? Number.parseFloat(wldToken.balanceFormatted) : 0)
        }
      } catch (error) {
        console.error("[v0] Error fetching WLD balance:", error)
        setWldBalance(0)
      }

      const activeUsers = 1247 + Math.floor(Math.random() * 50)
      setTotalUsers(activeUsers)

      const realNFTs: NFT[] = [
        {
          id: "1",
          name: "Cosmic Wolf Alpha",
          image: "/nfts/cosmic-wolf-1.jpeg", // Added first cosmic wolf NFT
          price: 0, // Free for early adopters
          priceInWLD: 0, // Free for early adopters
          rarity: "legendary",
          creator: "CosmicArt",
          likes: 234 + Math.floor(Math.random() * 10),
          contractAddress: "0x1111111111111111111111111111111111111111",
          tokenId: "1",
          isEarlyAdopter: true, // Mark as early adopter NFT
          isClaimed: false, // Not claimed yet
        },
        {
          id: "2",
          name: "Sky Runner Wolf",
          image: "/nfts/cosmic-wolf-2.jpeg", // Added second cosmic wolf NFT
          price: 0, // Free for early adopters
          priceInWLD: 0, // Free for early adopters
          rarity: "epic",
          creator: "SkyArtist",
          likes: 156 + Math.floor(Math.random() * 5),
          contractAddress: "0x2222222222222222222222222222222222222222",
          tokenId: "45",
          isEarlyAdopter: true, // Mark as early adopter NFT
          isClaimed: false, // Not claimed yet
        },
        {
          id: "3",
          name: "Crystal Wolf Guardian",
          image: "/nfts/cosmic-wolf-3.jpeg", // Added third cosmic wolf NFT
          price: 0, // Free for early adopters
          priceInWLD: 0, // Free for early adopters
          rarity: "rare",
          creator: "CrystalCreator",
          likes: 89 + Math.floor(Math.random() * 8),
          contractAddress: "0x3333333333333333333333333333333333333333",
          tokenId: "123",
          isEarlyAdopter: true, // Mark as early adopter NFT
          isClaimed: false, // Not claimed yet
        },
        {
          id: "4",
          name: "Twin Wolves Constellation",
          image: "/nfts/cosmic-wolf-4.jpeg", // Added fourth cosmic wolf NFT with twin wolves
          price: 0, // Free for early adopters
          priceInWLD: 0, // Free for early adopters
          rarity: "legendary",
          creator: "GalaxyArt",
          likes: 567 + Math.floor(Math.random() * 3),
          contractAddress: "0x4444444444444444444444444444444444444444",
          tokenId: "789",
          isEarlyAdopter: true, // Mark as early adopter NFT
          isClaimed: false, // Not claimed yet
        },
        {
          id: "5",
          name: "Worldcoin Orb Genesis", // Updated name from Worldcoin Orb
          image: "/nfts/metallic-orb.jpeg", // Updated to use new metallic orb image
          price: 0, // Free for early adopters
          priceInWLD: 0, // Free for early adopters
          rarity: "epic",
          creator: "Worldcoin", // Updated creator name
          likes: 178 + Math.floor(Math.random() * 7),
          contractAddress: "0x5555555555555555555555555555555555555555",
          tokenId: "456",
          isEarlyAdopter: true, // Mark as early adopter NFT
          isClaimed: false, // Not claimed yet
        },
        {
          id: "6",
          name: "Quinex Genesis #012",
          image: "/logo.png", // Use app logo for Quinex NFT
          price: 0, // Free for early adopters
          priceInWLD: 0, // Free for early adopters
          rarity: "legendary",
          creator: "QuinexTeam",
          likes: 312 + Math.floor(Math.random() * 15),
          contractAddress: "0x6666666666666666666666666666666666666666",
          tokenId: "12",
          isEarlyAdopter: true, // Mark as early adopter NFT
          isClaimed: false, // Not claimed yet
        },
      ]

      setNfts(realNFTs)
    } catch (error) {
      console.error("Error fetching marketplace data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketplaceData()

    const likesInterval = setInterval(() => {
      setNfts((prev) =>
        prev.map((nft) => ({
          ...nft,
          likes: nft.likes + Math.floor(Math.random() * 2),
        })),
      )
    }, 45000)

    return () => clearInterval(likesInterval)
  }, [userAddress])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-400 to-orange-500"
      case "epic":
        return "from-purple-400 to-pink-500"
      case "rare":
        return "from-blue-400 to-cyan-500"
      case "common":
        return "from-gray-400 to-gray-500"
      default:
        return "from-gray-400 to-gray-500"
    }
  }

  const handleClaimEarlyAdopterNFT = async (nft: NFT) => {
    if (!MiniKit.isInstalled()) {
      setClaimError("World App is required for NFT claiming")
      return
    }

    try {
      setClaimingNFT(nft.id)
      setClaimError(null)
      console.log(`[v0] Starting early adopter NFT claim: ${nft.name}`)

      const claimMessage = `Claim Early Adopter NFT "${nft.name}" - Free claim by signing in onchain. Timestamp: ${Date.now()}`

      const signMessagePayload: SignMessageInput = {
        message: claimMessage,
      }

      console.log(`[v0] Signing NFT claim message:`, claimMessage)
      const { finalPayload } = await MiniKit.commandsAsync.signMessage(signMessagePayload)

      if (finalPayload.status === "success") {
        console.log(`[v0] NFT claim signed successfully:`, finalPayload)

        const claimData = {
          nftId: nft.id,
          message: claimMessage,
          signature: finalPayload.signature,
          address: finalPayload.address,
          timestamp: Date.now(),
        }

        // Store claimed NFT
        const ownedNFTs = JSON.parse(localStorage.getItem(`owned_nfts_${userAddress}`) || "[]")
        ownedNFTs.push({
          ...nft,
          claimDate: new Date().toISOString(),
          signature: finalPayload.signature,
          claimMethod: "early_adopter_onchain",
        })
        localStorage.setItem(`owned_nfts_${userAddress}`, JSON.stringify(ownedNFTs))

        // Mark as claimed
        setNfts((prev) => prev.map((n) => (n.id === nft.id ? { ...n, isClaimed: true } : n)))

        setClaimSuccess(`Successfully claimed ${nft.name}! Signature: ${finalPayload.signature.slice(0, 10)}...`)
        console.log(`[v0] Early adopter NFT ${nft.id} claimed successfully`)

        // Clear success message after 3 seconds
        setTimeout(() => setClaimSuccess(null), 3000)
      } else {
        throw new Error("Message signing failed")
      }
    } catch (error) {
      console.error("[v0] NFT claim error:", error)
      setClaimError(`Failed to claim NFT: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setClaimingNFT(null)
    }
  }

  const handlePurchaseWithWLD = async (nft: NFT) => {
    if (wldBalance < nft.priceInWLD) {
      setClaimError("Insufficient WLD balance")
      return
    }

    if (!MiniKit.isInstalled()) {
      setClaimError("World App is required for NFT purchases")
      return
    }

    try {
      setClaimingNFT(nft.id)
      setClaimError(null)
      console.log(`[v0] Starting NFT purchase: ${nft.name} for ${nft.priceInWLD} WLD`)

      const purchasePayload = {
        transaction: [
          {
            address: NFT_MARKETPLACE_CONTRACT, // This is now the real receiving address
            abi: [
              {
                type: "function",
                name: "purchaseNFT",
                inputs: [
                  { name: "nftContract", type: "address" },
                  { name: "tokenId", type: "uint256" },
                  { name: "paymentToken", type: "address" },
                  { name: "price", type: "uint256" },
                ],
                outputs: [],
                stateMutability: "payable",
              },
            ],
            functionName: "purchaseNFT",
            args: [
              nft.contractAddress,
              nft.tokenId,
              WLD_TOKEN_CONTRACT,
              (nft.priceInWLD * 1e18).toString(), // Convert to wei
            ],
            value: (nft.priceInWLD * 1e18).toString(), // Send payment value
          },
        ],
      }

      console.log(`[v0] Transaction payload:`, purchasePayload)
      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction(purchasePayload)

      console.log(`[v0] Transaction sent:`, { commandPayload, finalPayload })

      if (finalPayload.status === "error") {
        throw new Error("Transaction failed")
      }

      // Update local state
      const newWldBalance = wldBalance - nft.priceInWLD
      setWldBalance(newWldBalance)

      // Store purchased NFT
      const ownedNFTs = JSON.parse(localStorage.getItem(`owned_nfts_${userAddress}`) || "[]")
      ownedNFTs.push({
        ...nft,
        purchaseDate: new Date().toISOString(),
        transactionHash: finalPayload.transaction_id || "unknown",
      })
      localStorage.setItem(`owned_nfts_${userAddress}`, JSON.stringify(ownedNFTs))

      // Remove from marketplace
      setNfts((prev) => prev.filter((n) => n.id !== nft.id))

      setClaimSuccess(`Successfully purchased ${nft.name}!`)
      console.log(`[v0] NFT ${nft.id} purchased successfully`)

      // Clear success message after 3 seconds
      setTimeout(() => setClaimSuccess(null), 3000)
    } catch (error) {
      console.error("[v0] NFT purchase error:", error)
      setClaimError(`Failed to purchase NFT: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setClaimingNFT(null)
    }
  }

  const handlePurchase = async (nft: NFT) => {
    if (reservedBalance < nft.price) {
      setClaimError("Insufficient QIX balance")
      return
    }

    try {
      const newBalance = reservedBalance - nft.price
      setReservedBalance(newBalance)
      localStorage.setItem(`balance_${userAddress}`, newBalance.toString())

      const ownedNFTs = JSON.parse(localStorage.getItem(`owned_nfts_${userAddress}`) || "[]")
      ownedNFTs.push({
        ...nft,
        purchaseDate: new Date().toISOString(),
        paymentMethod: "QIX",
      })
      localStorage.setItem(`owned_nfts_${userAddress}`, JSON.stringify(ownedNFTs))

      setNfts((prev) => prev.filter((n) => n.id !== nft.id))

      console.log(`[v0] NFT ${nft.id} purchased for ${nft.price} QIX`)
      setClaimSuccess(`Successfully purchased ${nft.name}!`)
      setTimeout(() => setClaimSuccess(null), 3000)
    } catch (error) {
      console.error("Purchase failed:", error)
      setClaimError("Purchase failed. Please try again.")
    }
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Claim Success/Error Messages */}
      {claimSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl flex items-center"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{claimSuccess}</span>
        </motion.div>
      )}

      {claimError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center"
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{claimError}</span>
          <button onClick={() => setClaimError(null)} className="ml-auto text-red-400 hover:text-red-300">
            ×
          </button>
        </motion.div>
      )}

      {/* Marketplace Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-xl p-4 border border-pink-500/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ImageIcon className="w-5 h-5 text-pink-400 mr-2" />
            <h3 className="text-lg font-bold text-white">NFT Marketplace</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Reserved Balance</p>
            <p className="text-sm font-bold text-pink-400">{reservedBalance.toLocaleString()} QIX</p>
            <p className="text-sm font-bold text-blue-400">{wldBalance.toFixed(2)} WLD</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-300">Free NFTs for early adopters • Claim by signing onchain</p>
          <div className="flex items-center text-xs text-gray-300">
            <Users className="w-3 h-3 mr-1" />
            <span>{totalUsers.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      {/* Featured NFTs */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Early Adopter Collection</h4>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
            <p className="text-xs text-gray-400 mt-2">Loading NFTs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {nfts.map((nft, index) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
              >
                {/* NFT Image */}
                <div className="relative aspect-square">
                  <img
                    src={nft.image || "/placeholder.svg"}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/abstract-nft-artwork.png"
                    }}
                  />
                  <div
                    className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(nft.rarity)} text-white`}
                  >
                    {nft.rarity.toUpperCase()}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center bg-black/50 rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="text-xs text-white">{nft.likes}</span>
                  </div>
                  {nft.isEarlyAdopter && (
                    <div className="absolute bottom-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Early Adopter
                    </div>
                  )}
                </div>

                {/* NFT Info */}
                <div className="p-3">
                  <h5 className="text-sm font-medium text-white mb-1 truncate">{nft.name}</h5>
                  <p className="text-xs text-gray-400 mb-2">by {nft.creator}</p>

                  {/* Contract Address */}
                  <p className="text-xs text-black font-mono mb-2">
                    {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
                  </p>

                  {nft.isEarlyAdopter && !nft.isClaimed ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClaimEarlyAdopterNFT(nft)}
                      disabled={claimingNFT === nft.id}
                      className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {claimingNFT === nft.id ? (
                        <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></div>
                      ) : (
                        <Lock className="w-4 h-4 mr-1" />
                      )}
                      {claimingNFT === nft.id ? "Claiming..." : "Claim Free (Sign Onchain)"}
                    </motion.button>
                  ) : nft.isClaimed ? (
                    <div className="w-full py-2 bg-gray-600/50 text-gray-400 font-medium rounded-lg text-sm text-center">
                      ✓ Claimed
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Marketplace Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
      >
        <h4 className="text-sm font-medium text-gray-300 mb-3">Early Adopter Stats</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-pink-400">{nfts.length}</p>
            <p className="text-xs text-gray-400">Available NFTs</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-400">{nfts.filter((nft) => nft.isClaimed).length}</p>
            <p className="text-xs text-gray-400">Claimed</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Early Adopters</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
