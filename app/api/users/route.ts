import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const appId = process.env.APP_ID
    const apiKey = process.env.DEV_PORTAL_API_KEY

    if (!appId || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing APP_ID or DEV_PORTAL_API_KEY",
        },
        { status: 500 },
      )
    }

    // Since there's no direct users endpoint, we'll fetch recent transactions
    // to get user wallet addresses that have interacted with the app
    const transactionsUrl = `https://developer.worldcoin.org/api/v2/minikit/transactions?app_id=${appId}&limit=100`

    console.log("[v0] Fetching users from transactions:", transactionsUrl)

    const response = await fetch(transactionsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Failed to fetch transactions:", response.statusText)
      console.error("[v0] Error details:", errorText)

      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch user data from Developer Portal",
          status: response.status,
          error: response.statusText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Raw transactions data:", data)

    // Extract unique users from transactions
    const users = new Map()

    if (data.transactions && Array.isArray(data.transactions)) {
      data.transactions.forEach((transaction: any) => {
        if (transaction.from_address) {
          users.set(transaction.from_address, {
            wallet_address: transaction.from_address,
            last_transaction: transaction.created_at || transaction.timestamp,
            transaction_count: (users.get(transaction.from_address)?.transaction_count || 0) + 1,
            last_transaction_id: transaction.id || transaction.transaction_id,
            status: transaction.status || "unknown",
          })
        }
      })
    }

    const userList = Array.from(users.values())

    console.log("[v0] Processed users:", userList)

    return NextResponse.json({
      success: true,
      data: {
        total_users: userList.length,
        users: userList,
        app_id: appId,
        fetched_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
