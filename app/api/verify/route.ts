import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "@worldcoin/minikit-js"
import { type NextRequest, NextResponse } from "next/server"

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal: string | undefined
}

export async function POST(req: NextRequest) {
  const { payload, action, signal } = (await req.json()) as IRequestPayload
  const app_id = process.env.APP_ID as `app_${string}`

  try {
    const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse

    console.log("[v0] World ID verification result:", verifyRes)

    if (verifyRes.success) {
      return NextResponse.json({
        success: true,
        nullifier_hash: payload.nullifier_hash,
        wallet_address: payload.wallet_address || "0x0000000000000000000000000000000000000000",
        verification_level: payload.verification_level,
        status: 200,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          detail: verifyRes.detail || "World ID verification failed",
          status: 400,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("[v0] World ID verification error:", error)
    return NextResponse.json(
      {
        success: false,
        detail: "Internal server error during verification",
        status: 500,
      },
      { status: 500 },
    )
  }
}
