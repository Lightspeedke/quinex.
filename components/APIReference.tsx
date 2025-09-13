"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ExternalLink, Code, Globe, Database, Bell } from "lucide-react"

export default function APIReference() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const endpoints = [
    {
      id: "send-notification",
      method: "POST",
      path: "/api/v2/minikit/send-notification",
      title: "Send Notification",
      description: "Send localized notifications to users of your mini app",
      icon: <Bell className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      id: "get-transaction",
      method: "GET",
      path: "/api/v2/minikit/transaction/{transaction_id}",
      title: "Get Transaction",
      description: "Query your app transactions for their current status",
      icon: <Database className="h-5 w-5" />,
      requiresAuth: false,
    },
    {
      id: "debug-transaction",
      method: "GET",
      path: "/api/v2/minikit/transaction/debug",
      title: "Get Transaction Debug URL",
      description: "Debug transactions that failed during the prepare stage",
      icon: <Code className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      id: "get-prices",
      method: "GET",
      path: "/public/v1/miniapps/prices",
      title: "Get Prices",
      description: "Query the latest prices of Worldcoin token in various fiat currencies",
      icon: <Globe className="h-5 w-5" />,
      requiresAuth: false,
    },
  ]

  const supportedLanguages = [
    { name: "English", code: "en" },
    { name: "Catalan", code: "ca" },
    { name: "Chinese Simplified", code: "zh_CN" },
    { name: "French", code: "fr" },
    { name: "German", code: "de" },
    { name: "Hindi", code: "hi" },
    { name: "Indonesian", code: "id" },
    { name: "Japanese", code: "ja" },
    { name: "Korean", code: "ko" },
    { name: "Malay", code: "ms" },
    { name: "Polish", code: "pl" },
    { name: "Portuguese", code: "pt" },
    { name: "Spanish", code: "es" },
    { name: "Spanish (Latin America)", code: "es_419" },
    { name: "Thai", code: "th" },
    { name: "Traditional Chinese (Taiwan)", code: "zh_TW" },
  ]

  const curlExample = `curl -X POST "https://developer.worldcoin.org/api/v2/minikit/send-notification" \\
    -H "Authorization: Bearer {api_key}" \\
    -H "Content-Type: application/json" \\
    -d '{
      "app_id": "app_id",
      "wallet_addresses": ["0x123", "0x456"],
      "title": "Transaction Complete",
      "message": "Hello \${username}, your transaction is complete!",
      "mini_app_path": "worldapp://mini-app?app_id=your_app_id&path=/success"
    }'`

  const jsExample = `fetch("https://developer.worldcoin.org/api/v2/minikit/send-notification", {
  method: "POST",
  headers: {
    "Authorization": "Bearer {api_key}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    app_id: "app_id",
    wallet_addresses: ["0x123", "0x456"],
    title: "Transaction Complete",
    message: "Hello \${username}, your transaction is complete!",
    mini_app_path: "worldapp://mini-app?app_id=your_app_id&path=/success"
  })
})`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">World Mini Apps API Reference</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete API documentation for integrating with World Mini Apps. Build powerful applications with
            notifications, transactions, and real-time data.
          </p>
        </div>

        {/* API Endpoints Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {endpoints.map((endpoint) => (
            <Card
              key={endpoint.id}
              className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {endpoint.icon}
                  <Badge variant={endpoint.method === "POST" ? "default" : "secondary"}>{endpoint.method}</Badge>
                </div>
                <CardTitle className="text-white text-lg">{endpoint.title}</CardTitle>
                <CardDescription className="text-gray-300 text-sm">{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs text-blue-300 bg-black/20 p-2 rounded block overflow-x-auto">
                  {endpoint.path}
                </code>
                {endpoint.requiresAuth && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Requires API Key
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Documentation */}
        <Tabs defaultValue="send-notification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="send-notification" className="data-[state=active]:bg-white/20">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="get-transaction" className="data-[state=active]:bg-white/20">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="debug-transaction" className="data-[state=active]:bg-white/20">
              Debug
            </TabsTrigger>
            <TabsTrigger value="get-prices" className="data-[state=active]:bg-white/20">
              Prices
            </TabsTrigger>
          </TabsList>

          {/* Send Notification Tab */}
          <TabsContent value="send-notification" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Send Notification
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Send localized notifications to users of your mini app. Requires an API key.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Parameters */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Required Parameters</h3>
                  <div className="space-y-3">
                    <div className="bg-black/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-blue-300">wallet_addresses</code>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Array of wallet addresses to send notifications to. Max 1000 users per call.
                      </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-blue-300">app_id</code>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <p className="text-gray-300 text-sm">The identifier of the app initiating the notification.</p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-blue-300">mini_app_path</code>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <p className="text-gray-300 text-sm">
                        URL encoded path where notification should link when clicked.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Code Examples */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Code Examples</h3>
                  <Tabs defaultValue="curl" className="space-y-4">
                    <TabsList className="bg-black/20">
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl">
                      <div className="relative">
                        <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
                          <code>{curlExample}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 bg-transparent"
                          onClick={() => copyToClipboard(curlExample, "curl")}
                        >
                          {copiedCode === "curl" ? "Copied!" : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="javascript">
                      <div className="relative">
                        <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
                          <code>{jsExample}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 bg-transparent"
                          onClick={() => copyToClipboard(jsExample, "js")}
                        >
                          {copiedCode === "js" ? "Copied!" : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Supported Languages */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Supported Languages</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {supportedLanguages.map((lang) => (
                      <div key={lang.code} className="bg-black/20 p-3 rounded-lg">
                        <div className="text-white text-sm font-medium">{lang.name}</div>
                        <code className="text-blue-300 text-xs">{lang.code}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Get Transaction Tab */}
          <TabsContent value="get-transaction" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Get Transaction Status
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Query your app's transactions for their current status. No API key required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Endpoint</h4>
                  <code className="text-blue-300 text-sm">
                    GET /api/v2/minikit/transaction/{"{transaction_id}"}?app_id=&type=
                  </code>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Query Parameters</h4>
                  <div className="space-y-3">
                    <div className="bg-black/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-blue-300">app_id</code>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <p className="text-gray-300 text-sm">The app_id corresponding to the transaction</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-blue-300">type</code>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <p className="text-gray-300 text-sm">Either "pay" (payment) or "sendTransaction" (transaction)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Response Fields</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-black/20 p-3 rounded-lg">
                      <code className="text-blue-300 text-sm">transaction_status</code>
                      <p className="text-gray-300 text-xs mt-1">pending | mined | failed</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg">
                      <code className="text-blue-300 text-sm">transaction_hash</code>
                      <p className="text-gray-300 text-xs mt-1">Blockchain transaction hash</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg">
                      <code className="text-blue-300 text-sm">token_amount</code>
                      <p className="text-gray-300 text-xs mt-1">Amount in BigInt with 6 decimals</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg">
                      <code className="text-blue-300 text-sm">chain</code>
                      <p className="text-gray-300 text-xs mt-1">Blockchain network name</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Debug Transaction Tab */}
          <TabsContent value="debug-transaction" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Transaction Debug
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Debug transactions that failed during the prepare stage. Provides Tenderly URLs for permit2
                  operations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Endpoint</h4>
                  <code className="text-blue-300 text-sm">GET /api/v2/minikit/transaction/debug?app_id=</code>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-lg">
                  <h4 className="text-yellow-300 font-semibold mb-2">Note</h4>
                  <p className="text-yellow-200 text-sm">
                    Debug URL is only available once the permit2 expires. For development, set a shorter expiry time to
                    get debug URLs quicker.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Response</h4>
                  <div className="bg-black/40 p-4 rounded-lg">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
                      {`{
  "transactions": [
    {
      "debugUrl": "https://dashboard.tenderly.co/tx/...",
      "createdAt": "2024-03-21T10:30:00.000Z",
      "block": 12345678,
      "simulationRequestId": "sim_abc123def456",
      "simulationError": "Permit signature expired",
      "walletAddress": "0x1234..."
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Get Prices Tab */}
          <TabsContent value="get-prices" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Get Token Prices
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Query the latest prices of Worldcoin token in various fiat currencies. Public endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Endpoint</h4>
                  <code className="text-blue-300 text-sm">
                    GET /public/v1/miniapps/prices?cryptoCurrencies=WLD,USDC&fiatCurrencies=USD,EUR
                  </code>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Parameters</h4>
                  <div className="space-y-3">
                    <div className="bg-black/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-blue-300">cryptoCurrencies</code>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <p className="text-gray-300 text-sm">Comma-separated list: WLD, USDC</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-blue-300">fiatCurrencies</code>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <p className="text-gray-300 text-sm">ISO4217 currency codes: USD, EUR, JPY, etc.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Example Response</h4>
                  <div className="bg-black/40 p-4 rounded-lg">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
                      {`{
  "result": {
    "prices": {
      "WLD": {
        "USD": {
          "asset": "USD",
          "amount": "1510763",
          "decimals": 6,
          "symbol": "USD"
        }
      },
      "USDC": {
        "USD": {
          "asset": "USD", 
          "amount": "1000058",
          "decimals": 6,
          "symbol": "USD"
        }
      }
    }
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-lg">
                  <h4 className="text-blue-300 font-semibold mb-2">Price Calculation</h4>
                  <p className="text-blue-200 text-sm">
                    To get the actual price, use: <code>amount * 10^(-decimals)</code>
                    <br />
                    Example: 1510763 with 6 decimals = $1.51
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-white/20">
          <p className="text-gray-400 mb-4">For more information, visit the official World Developer Portal</p>
          <Button variant="outline" className="gap-2 bg-transparent">
            <ExternalLink className="h-4 w-4" />
            View Full Documentation
          </Button>
        </div>
      </div>
    </div>
  )
}
