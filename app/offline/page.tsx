import Link from "next/link"
import { ShieldAlert, RefreshCw, WifiOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <Card className="w-full border-2 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <WifiOff className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-serif">You&apos;re offline</CardTitle>
              <CardDescription className="text-base">
                SecurePass is still available for the pages you&apos;ve already opened. Reconnect to refresh data or
                install the app for a smoother offline experience.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-card/70 p-4">
                <div className="mb-3 flex items-center gap-2 font-medium">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Cached pages only
                </div>
                <p className="text-sm text-muted-foreground">
                  Previously visited routes and core assets remain available until the cache is refreshed.
                </p>
              </div>
              <div className="rounded-xl border bg-card/70 p-4">
                <div className="mb-3 flex items-center gap-2 font-medium">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Retry when ready
                </div>
                <p className="text-sm text-muted-foreground">
                  Once your connection is back, reload the app to sync the latest UI and content.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/">Return Home</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/offline">Retry Offline View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
