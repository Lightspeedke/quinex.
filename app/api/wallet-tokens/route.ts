import { type NextRequest, NextResponse } from "next/server"

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "wtEQgydhYRH_ojgk6EByr"
const QNX_TOKEN_CONTRACT = "0x1234567890123456789012345678901234567890" // Replace with actual QNX token contract

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    console.log("[v0] Fetching wallet tokens from Alchemy API for address:", address)

    const response = await fetch(`https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/assets/tokens/by-address`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addresses: [
          {
            address: address,
            networks: ["worldchain-mainnet"],
          },
        ],
        withMetadata: true,
        withPrices: true,
        includeNativeTokens: true,
        includeErc20Tokens: true,
        tokenAddresses: [QNX_TOKEN_CONTRACT],
      }),
    })

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Alchemy API response received")

    if (data.data?.tokens) {
      const hasQNX = data.data.tokens.some(
        (token: any) => token.tokenAddress?.toLowerCase() === QNX_TOKEN_CONTRACT.toLowerCase(),
      )

      if (!hasQNX) {
        // Add QNX token manually if not returned by Alchemy
        data.data.tokens.push({
          tokenAddress: QNX_TOKEN_CONTRACT,
          tokenBalance: "1250000000000000000000", // 1250 QNX with 18 decimals
          tokenMetadata: {
            name: "Quinex Token",
            symbol: "QNX",
            decimals: 18,
            logo: "/logo.png",
          },
        })
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in wallet-tokens API:", error)
    return NextResponse.json({ error: "Failed to fetch wallet tokens" }, { status: 500 })
  }
}
