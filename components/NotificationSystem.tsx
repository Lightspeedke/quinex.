"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Bell, Send, Users, Globe, Plus, X, CheckCircle, AlertCircle } from "lucide-react"

interface NotificationResult {
  walletAddress: string
  sent: boolean
  reason?: string
}

interface Localisation {
  language: string
  title: string
  message: string
}

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh_CN", name: "Chinese Simplified" },
  { code: "zh_TW", name: "Chinese Traditional" },
  { code: "pt", name: "Portuguese" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "pl", name: "Polish" },
  { code: "ca", name: "Catalan" },
  { code: "es_419", name: "Spanish (Latin America)" },
]

const PRESET_NOTIFICATIONS = [
  {
    title: "🎉 New QNX Rewards Available!",
    message: "Hey ${username}! You have new QNX tokens ready to claim. Don't miss out on your rewards!",
    addresses: "",
  },
  {
    title: "🗳️ Governance Vote Live",
    message: "A new governance proposal is now live! Cast your vote and help shape the future of Quinex.",
    addresses: "",
  },
  {
    title: "🚀 NFT Drop Alert",
    message: "Limited edition Cosmic Wolf NFTs are now available! Claim yours before they're gone.",
    addresses: "",
  },
  {
    title: "💰 Staking Rewards Ready",
    message: "Your staking rewards are ready to harvest! Check your dashboard to claim them.",
    addresses: "",
  },
]

export default function NotificationSystem() {
  const [walletAddresses, setWalletAddresses] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [localisations, setLocalisations] = useState<Localisation[]>([{ language: "en", title: "", message: "" }])
  const [useLocalisations, setUseLocalisations] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<NotificationResult[]>([])
  const { toast } = useToast()

  const addLocalisation = () => {
    setLocalisations([...localisations, { language: "es", title: "", message: "" }])
  }

  const removeLocalisation = (index: number) => {
    if (localisations.length > 1) {
      setLocalisations(localisations.filter((_, i) => i !== index))
    }
  }

  const updateLocalisation = (index: number, field: keyof Localisation, value: string) => {
    const updated = [...localisations]
    updated[index][field] = value
    setLocalisations(updated)
  }

  const sendNotification = async () => {
    if (!walletAddresses.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one wallet address",
        variant: "destructive",
      })
      return
    }

    if (!useLocalisations && (!title.trim() || !message.trim())) {
      toast({
        title: "Error",
        description: "Please enter both title and message",
        variant: "destructive",
      })
      return
    }

    if (useLocalisations && localisations.some((loc) => !loc.title.trim() || !loc.message.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all localisation fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResults([])

    try {
      const addresses = walletAddresses
        .split("\n")
        .map((addr) => addr.trim())
        .filter((addr) => addr.length > 0)

      const payload = {
        wallet_addresses: addresses,
        ...(useLocalisations ? { localisations } : { title, message: message.replace(/\${username}/g, "${username}") }),
      }

      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.result)
        const successCount = data.result.filter((r: NotificationResult) => r.sent).length
        const totalCount = data.result.length

        toast({
          title: "Notifications Sent",
          description: `Successfully sent ${successCount}/${totalCount} notifications`,
        })
      } else {
        throw new Error(data.error || "Failed to send notifications")
      }
    } catch (error) {
      console.error("Error sending notifications:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyPreset = (preset: any) => {
    setTitle(preset.title)
    setMessage(preset.message)
    setWalletAddresses(preset.addresses)
    setUseLocalisations(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification System
          </CardTitle>
          <CardDescription>
            Send push notifications to users of your Quinex Token app using World Mini Apps API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Presets */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Presets</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PRESET_NOTIFICATIONS.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="justify-start text-left h-auto p-3"
                >
                  <div>
                    <div className="font-medium text-xs">{preset.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{preset.message.substring(0, 50)}...</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Wallet Addresses */}
          <div>
            <Label htmlFor="addresses" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Wallet Addresses (one per line, max 1000)
            </Label>
            <Textarea
              id="addresses"
              placeholder="0x1234567890abcdef1234567890abcdef12345678&#10;0xabcdef1234567890abcdef1234567890abcdef12&#10;..."
              value={walletAddresses}
              onChange={(e) => setWalletAddresses(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {walletAddresses.split("\n").filter((addr) => addr.trim()).length} addresses
            </div>
          </div>

          {/* Notification Content */}
          <Tabs
            value={useLocalisations ? "localized" : "simple"}
            onValueChange={(v) => setUseLocalisations(v === "localized")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple">Simple Message</TabsTrigger>
              <TabsTrigger value="localized" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Localized
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4">
              <div>
                <Label htmlFor="title">Title (max 30 characters)</Label>
                <Input
                  id="title"
                  placeholder="🎉 New QNX Rewards Available!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={30}
                />
                <div className="text-xs text-muted-foreground mt-1">{title.length}/30 characters</div>
              </div>

              <div>
                <Label htmlFor="message">Message (max 200 characters)</Label>
                <Textarea
                  id="message"
                  placeholder="Hey ${username}! You have new rewards ready to claim..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {message.length}/200 characters • Use ${"{username}"} for personalization
                </div>
              </div>
            </TabsContent>

            <TabsContent value="localized" className="space-y-4">
              <div className="space-y-4">
                {localisations.map((loc, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {SUPPORTED_LANGUAGES.find((lang) => lang.code === loc.language)?.name || loc.language}
                        </Badge>
                        {index === 0 && <Badge>Required</Badge>}
                      </div>
                      {index > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => removeLocalisation(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Language</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={loc.language}
                          onChange={(e) => updateLocalisation(index, "language", e.target.value)}
                        >
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Title</Label>
                        <Input
                          placeholder="Localized title..."
                          value={loc.title}
                          onChange={(e) => updateLocalisation(index, "title", e.target.value)}
                          maxLength={30}
                        />
                      </div>

                      <div>
                        <Label>Message</Label>
                        <Textarea
                          placeholder="Localized message..."
                          value={loc.message}
                          onChange={(e) => updateLocalisation(index, "message", e.target.value)}
                          maxLength={200}
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                <Button variant="outline" onClick={addLocalisation} className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Language
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Send Button */}
          <Button onClick={sendNotification} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending Notifications...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notifications
              </>
            )}
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Delivery Results</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <Alert key={index} className={result.sent ? "border-green-200" : "border-red-200"}>
                    <div className="flex items-center gap-2">
                      {result.sent ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="flex-1">
                        <div className="font-mono text-xs">
                          {result.walletAddress.substring(0, 6)}...{result.walletAddress.substring(38)}
                        </div>
                        {result.reason && <div className="text-xs text-muted-foreground">{result.reason}</div>}
                      </div>
                      <Badge variant={result.sent ? "default" : "destructive"}>{result.sent ? "Sent" : "Failed"}</Badge>
                    </div>
                  </Alert>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Successfully sent: {results.filter((r) => r.sent).length}/{results.length} notifications
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
