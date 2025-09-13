import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { addresses } = await request.json()

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json({ error: "Invalid addresses array" }, { status: 400 })
    }

    const apiKey = process.env.ALCHEMY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Alchemy API key not configured" }, { status: 500 })
    }

    const fetchURL = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-address`

    const requestBody = {
      addresses: addresses.map((addr: any) => ({
        network: "worldchain-mainnet", // World Chain network
        address: addr.address,
      })),
    }

    const response = await fetch(fetchURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform the response to match our expected format
    const priceMap: Record<string, number> = {}

    if (data.data) {
      data.data.forEach((tokenData: any) => {
        if (tokenData.prices && tokenData.prices.length > 0) {
          const price = Number.parseFloat(tokenData.prices[0].value)
          // Find the original address from our request
          const matchingAddress = addresses.find(
            (addr: any) => addr.address.toLowerCase() === tokenData.address?.toLowerCase(),
          )
          if (matchingAddress) {
            priceMap[matchingAddress.address] = price
          }
        }
      })
    }

    return NextResponse.json({ prices: priceMap })
  } catch (error) {
    console.error("Token prices API error:", error)
    return NextResponse.json({ error: "Failed to fetch token prices" }, { status: 500 })
  }
}
