import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { airdropContractABI, AIRDROP_CONTRACT_ADDRESS, RPC_ENDPOINTS } from "@/lib/airdropContractABI"

export async function GET(request: NextRequest, context: { params: { userAddress: string } }) {
  try {
    const { userAddress } = context.params

    if (!userAddress || !ethers.isAddress(userAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing user address",
        },
        { status: 400 },
      )
    }

    console.log(`Fetching claim status for user: ${userAddress}`)

    let lastError = null

    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        console.log(`Trying RPC endpoint: ${rpcUrl}`)

        const provider = new ethers.JsonRpcProvider(rpcUrl)

        const code = await provider.getCode(AIRDROP_CONTRACT_ADDRESS)
        if (code === "0x") {
          console.log(`Contract not found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)
          continue
        }

        console.log(`Contract found at ${AIRDROP_CONTRACT_ADDRESS} using RPC ${rpcUrl}`)

        const contract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, airdropContractABI, provider)

        const lastClaimedTimestamp = await contract.lastClaimed(userAddress)
        const claimCooldown = await contract.claimCooldown()
        const claimAmount = await contract.claimAmount()
        const currentTime = Math.floor(Date.now() / 1000)

        let canClaim = true
        let nextClaimTime = 0
        let timeLeft = 0

        if (lastClaimedTimestamp.toString() !== "0") {
          nextClaimTime = Number(lastClaimedTimestamp) + Number(claimCooldown)
          if (currentTime < nextClaimTime) {
            canClaim = false
            timeLeft = nextClaimTime - currentTime
          }
        }

        const formattedClaimAmount = ethers.formatUnits(claimAmount, 18)

        // Initialize tokenBalance as null to indicate we haven't fetched it yet
        let tokenBalance = null

        // Try multiple approaches to get the token balance
        try {
          // Approach 1: Try to get token address from astraToken() function
          try {
            if (typeof contract.astraToken === "function") {
              const tokenAddress = await contract.astraToken()
              console.log("Token address from contract:", tokenAddress)

              if (tokenAddress && ethers.isAddress(tokenAddress)) {
                const tokenCode = await provider.getCode(tokenAddress)
                if (tokenCode !== "0x") {
                  const tokenContract = new ethers.Contract(
                    tokenAddress,
                    [
                      {
                        constant: true,
                        inputs: [{ name: "_owner", type: "address" }],
                        name: "balanceOf",
                        outputs: [{ name: "balance", type: "uint256" }],
                        type: "function",
                      },
                    ],
                    provider,
                  )

                  const balance = await tokenContract.balanceOf(userAddress)
                  tokenBalance = ethers.formatUnits(balance, 18)
                  console.log(`Token balance for ${userAddress}: ${tokenBalance}`)
                } else {
                  console.log(`Token contract not found at ${tokenAddress}`)
                }
              }
            } else {
              console.log("astraToken function not found on contract")
            }
          } catch (tokenAddressError) {
            console.log("Error getting token address:", tokenAddressError)
          }

          // Approach 2: Try to get balance from MiniKit if available
          if (tokenBalance === null) {
            try {
              // This would require MiniKit integration on the server side
              // which might not be possible, but we're showing the approach
              console.log("Trying alternative balance sources...")

              // If we had server-side access to MiniKit or another balance source,
              // we would use it here
            } catch (miniKitError) {
              console.log("Error with alternative balance source:", miniKitError)
            }
          }
        } catch (error) {
          console.error("All balance fetching approaches failed:", error)
        }

        // Return the response with whatever balance we were able to get
        return NextResponse.json({
          success: true,
          address: userAddress,
          lastClaimed: Number(lastClaimedTimestamp),
          canClaim,
          nextClaimTime,
          timeLeft,
          claimAmount: formattedClaimAmount,
          balance: tokenBalance, // This will be null if we couldn't fetch it
          rpcUsed: rpcUrl,
        })
      } catch (error) {
        console.error(`Error with RPC ${rpcUrl}:`, error)
        lastError = error
      }
    }

    // If all RPC endpoints fail, return a response with null balance
    console.log("All RPC endpoints failed")
    return NextResponse.json({
      success: true,
      address: userAddress,
      lastClaimed: 0,
      canClaim: true,
      nextClaimTime: 0,
      timeLeft: 0,
      claimAmount: "6",
      balance: null, // Indicate we couldn't fetch the balance
      rpcUsed: "fallback",
      note: "Using fallback values due to RPC connection issues",
    })
  } catch (error) {
    console.error("Error fetching user claim status:", error)

    // Return a response with null balance in case of errors
    return NextResponse.json({
      success: true,
      address: context.params.userAddress,
      lastClaimed: 0,
      canClaim: true,
      nextClaimTime: 0,
      timeLeft: 0,
      claimAmount: "6",
      balance: null, // Indicate we couldn't fetch the balance
      rpcUsed: "error-fallback",
      note: "Using fallback values due to error",
    })
  }
}
