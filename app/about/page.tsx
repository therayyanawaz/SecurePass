import Link from "next/link"
import { ArrowLeft, CheckCircle2, Database, LayoutDashboard, Shield, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const FEATURE_BLOCKS = [
  {
    icon: Shield,
    title: "Local-first security",
    description: "Passwords are generated in your browser and stay on your device unless you choose to export them.",
  },
  {
    icon: Database,
    title: "Organized vault",
    description: "Save entries with labels and categories so they stay easy to find and manage.",
  },
  {
    icon: Wifi,
    title: "Offline support",
    description: "Install SecurePass and reopen the app after the first visit, even when your connection drops.",
  },
  {
    icon: LayoutDashboard,
    title: "Focused workflow",
    description: "Generate passwords quickly, then use the dashboard when you need to organize saved entries.",
  },
]

const SECURITY_NOTES = [
  "Use at least 12 characters whenever possible.",
  "Mix uppercase, lowercase, numbers, and symbols.",
  "Use different passwords for different accounts.",
  "Back up exported vault data somewhere you control.",
]

const COPYRIGHT_LABEL = `© ${new Date().getFullYear()} therayyanawaz`

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_62%)]" />
        <div className="absolute left-[-6rem] top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-7rem] top-32 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="rounded-full border-primary/15 bg-primary/8 px-4 py-1.5 text-primary">
              About SecurePass
            </Badge>
            <h1 className="max-w-4xl font-serif text-[clamp(3rem,7vw,5.4rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-balance">
              Private password generation, designed to stay simple, fast, and local.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              SecurePass helps you create strong passwords, save them locally on your device, and reopen your workspace even when you are offline.
            </p>
          </div>

          <Button asChild variant="outline" className="rounded-full border-primary/15 bg-background/80 px-5">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generator
            </Link>
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {FEATURE_BLOCKS.map(({ icon: Icon, title, description }, index) => {
            const hasBackgroundAccent = index === 2

            return (
              <Card
                key={title}
                className={`relative overflow-hidden rounded-[30px] border-primary/15 bg-background/80 shadow-[0_28px_84px_-56px_rgba(15,23,42,0.3)] backdrop-blur-2xl ${
                  hasBackgroundAccent ? "border-primary/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(2,6,23,0.02))]" : ""
                }`}
              >
                {hasBackgroundAccent ? (
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute right-[-2.75rem] top-[-2.75rem] h-36 w-36 rounded-full border border-primary/15" />
                    <div className="absolute right-2 top-2 h-24 w-24 rounded-full border border-primary/20" />
                    <div className="absolute right-10 top-10 h-8 w-8 rounded-full bg-primary/18 blur-sm" />
                    <div className="absolute bottom-0 right-0 h-28 w-32 bg-[radial-gradient(rgba(16,185,129,0.16)_1px,transparent_1px)] [background-size:14px_14px] opacity-70" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(16,185,129,0.08))]" />
                  </div>
                ) : null}

                <CardHeader className="relative space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-serif text-[1.8rem] tracking-[-0.03em]">{title}</CardTitle>
                  <CardDescription className="max-w-[15rem] text-sm leading-7">{description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="rounded-[32px] border-primary/15 bg-background/80 shadow-[0_32px_100px_-60px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
            <CardHeader className="space-y-3">
              <CardTitle className="font-serif text-[2.15rem] tracking-[-0.03em]">How SecurePass works</CardTitle>
              <CardDescription className="text-base leading-7">
                Generate a password, copy or save it, and open the dashboard whenever you want to manage saved entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                SecurePass is designed to reduce friction. Open the app, set your password rules, generate a result, and save only what you want to keep.
              </p>
              <p>
                Your vault lives in local browser storage on the current device. That keeps the workflow private and avoids account setup or a remote backend.
              </p>
              <p>
                The dashboard adds search, categories, and import or export tools for users who want a more organized vault over time.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-primary/15 bg-card/80 shadow-[0_32px_100px_-60px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
            <CardHeader className="space-y-3">
              <CardTitle className="font-serif text-[2.15rem] tracking-[-0.03em]">Security basics</CardTitle>
              <CardDescription className="text-base leading-7">
                A few habits still make the difference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SECURITY_NOTES.map((note) => (
                <div key={note} className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-background/70 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-foreground/90">{note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <footer className="border-t border-border/60 pt-4">
          <p className="text-center text-sm tracking-[0.14em] text-muted-foreground/90 sm:text-right">
            {COPYRIGHT_LABEL}
          </p>
        </footer>
      </div>
    </main>
  )
}
