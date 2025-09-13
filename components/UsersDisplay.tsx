"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Users, Wallet } from "lucide-react"

interface User {
  wallet_address: string
  last_transaction: string
  transaction_count: number
  last_transaction_id: string
  status: string
}

interface UsersData {
  total_users: number
  users: User[]
  app_id: string
  fetched_at: string
}

export default function UsersDisplay() {
  const [usersData, setUsersData] = useState<UsersData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/users")
      const data = await response.json()

      if (data.success) {
        setUsersData(data.data)
      } else {
        setError(data.message || "Failed to fetch users")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("[v0] Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "confirmed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Real App Users</CardTitle>
          </div>
          <Button onClick={fetchUsers} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>Users who have interacted with your World App</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading users...</span>
          </div>
        )}

        {usersData && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Total Users: <strong>{usersData.total_users}</strong>
              </span>
              <span>
                App ID: <strong>{usersData.app_id}</strong>
              </span>
              <span>Last Updated: {formatDate(usersData.fetched_at)}</span>
            </div>

            {usersData.users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found yet</p>
                <p className="text-sm">Users will appear here after they interact with your app</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usersData.users.map((user, index) => (
                  <div
                    key={user.wallet_address}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-mono text-sm font-medium">{formatAddress(user.wallet_address)}</div>
                        <div className="text-xs text-muted-foreground">
                          Last active: {formatDate(user.last_transaction)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {user.transaction_count} tx{user.transaction_count !== 1 ? "s" : ""}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
