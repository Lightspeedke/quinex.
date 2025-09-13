import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_addresses, title, message, localisations, mini_app_path } = body

    // Validate required fields
    if (!wallet_addresses || !Array.isArray(wallet_addresses) || wallet_addresses.length === 0) {
      return NextResponse.json({ error: "wallet_addresses is required and must be a non-empty array" }, { status: 400 })
    }

    if (wallet_addresses.length > 1000) {
      return NextResponse.json({ error: "Maximum 1000 wallet addresses allowed per request" }, { status: 400 })
    }

    // Validate that either title/message OR localisations are provided
    if ((!title || !message) && !localisations) {
      return NextResponse.json(
        { error: "Either title and message, or localisations must be provided" },
        { status: 400 },
      )
    }

    const apiKey = process.env.DEV_PORTAL_API_KEY
    const appId = process.env.NEXT_PUBLIC_APP_ID

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    if (!appId) {
      return NextResponse.json({ error: "App ID not configured" }, { status: 500 })
    }

    // Prepare the notification payload
    const notificationPayload = {
      app_id: appId,
      wallet_addresses,
      mini_app_path: mini_app_path || `worldapp://mini-app?app_id=${appId}`,
      ...(localisations ? { localisations } : { title, message }),
    }

    // Send notification to World API
    const response = await fetch("https://developer.worldcoin.org/api/v2/minikit/send-notification", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationPayload),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("World API Error:", result)
      return NextResponse.json({ error: "Failed to send notification", details: result }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: "Notifications sent successfully",
      result: result.result,
    })
  } catch (error) {
    console.error("Notification API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
