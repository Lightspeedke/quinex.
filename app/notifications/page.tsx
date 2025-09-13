import NotificationSystem from "@/components/NotificationSystem"

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Notification Center</h1>
          <p className="text-muted-foreground mt-2">Send push notifications to your Quinex Token app users</p>
        </div>

        <NotificationSystem />
      </div>
    </div>
  )
}
