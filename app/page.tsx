"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { getPasswordStorageSnapshot, savePassword, type Category } from "@/lib/password-storage"
import { ThemeToggle } from "@/components/theme-toggle"

const PasswordDashboard = dynamic(
  () => import("@/components/password-dashboard").then((mod) => mod.PasswordDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle>Loading dashboard</CardTitle>
              <CardDescription>Preparing your saved passwords and analytics.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    ),
  },
)

const PasswordScene = dynamic(() => import("@/components/password-scene").then((mod) => mod.PasswordScene), {
  ssr: false,
})

const SECURITY_TIPS = [
  "Use at least 12 characters for better security.",
  "Mix uppercase, lowercase, numbers, and symbols.",
  "Avoid personal details and common phrases.",
  "Use a different password for every account.",
]

type ToggleTileProps = {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  className,
}: {
  icon: typeof Shield
  label: string
  value: string
  detail: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-primary/10 bg-background/72 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
    </div>
  )
}

function InsightRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-[24px] border border-border/70 bg-background/75 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10">
      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <div className="font-semibold">{title}</div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function SecurityTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-background/70 px-4 py-3 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
      <p className="text-sm leading-6 text-foreground/90">{text}</p>
    </div>
  )
}

function ToggleTile({ id, label, description, checked, onCheckedChange }: ToggleTileProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-[22px] border px-4 py-4 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-md",
        checked
          ? "border-primary/20 bg-primary/7 shadow-[0_14px_30px_-24px_rgba(5,150,105,0.35)]"
          : "border-border/70 bg-background/80 hover:border-primary/15 hover:bg-primary/5",
      )}
    >
      <div>
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function PasswordGenerator() {
  const [password, setPassword] = useState("")
  const [length, setLength] = useState([16])
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  const [showPassword, setShowPassword] = useState(true)
  const [strength, setStrength] = useState(0)
  const [passwordLabel, setPasswordLabel] = useState("")
  const [passwordCategory, setPasswordCategory] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const [showScene, setShowScene] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [passwordStats, setPasswordStats] = useState({
    total: 0,
    weak: 0,
    fair: 0,
    good: 0,
    strong: 0,
  })
  const { toast } = useToast()

  const generatePassword = () => {
    let charset = ""
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (includeNumbers) charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, "")
    }

    if (charset === "") {
      toast({
        title: "Error",
        description: "Please select at least one character type",
        variant: "destructive",
      })
      return
    }

    let newPassword = ""
    for (let i = 0; i < length[0]; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    setPassword(newPassword)
    calculateStrength(newPassword)
  }

  const calculateStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score += 20
    if (pwd.length >= 12) score += 10
    if (pwd.length >= 16) score += 10
    if (/[a-z]/.test(pwd)) score += 15
    if (/[A-Z]/.test(pwd)) score += 15
    if (/[0-9]/.test(pwd)) score += 15
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15

    setStrength(Math.min(score, 100))
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password)
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive",
      })
    }
  }

  const loadData = () => {
    const snapshot = getPasswordStorageSnapshot()
    setPasswordStats(snapshot.passwordStats)
    setCategories(snapshot.categories)
  }

  const handleSavePassword = () => {
    if (!password) {
      toast({
        title: "Error",
        description: "No password to save",
        variant: "destructive",
      })
      return
    }

    const label = passwordLabel.trim() || `Password ${new Date().toLocaleDateString()}`

    const success = savePassword({
      password,
      label,
      strength,
      length: length[0],
      category: passwordCategory || undefined,
      settings: {
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar,
      },
    })

    if (success) {
      toast({
        title: "Saved!",
        description: `Password "${label}" saved successfully`,
      })
      setPasswordLabel("")
      setPasswordCategory("")
      setShowSaveDialog(false)
      loadData()
    } else {
      toast({
        title: "Error",
        description: "Failed to save password",
        variant: "destructive",
      })
    }
  }

  const getStrengthLabel = (currentStrength: number) => {
    if (currentStrength < 30) return { label: "Weak", tone: "bg-red-500" }
    if (currentStrength < 60) return { label: "Fair", tone: "bg-amber-500" }
    if (currentStrength < 80) return { label: "Good", tone: "bg-emerald-500" }
    return { label: "Strong", tone: "bg-emerald-600" }
  }

  useEffect(() => {
    generatePassword()
    loadData()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(max-width: 1023px), (prefers-reduced-motion: reduce)").matches) return

    const timeoutId = window.setTimeout(() => {
      setShowScene(true)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  if (showDashboard) {
    return <PasswordDashboard onClose={() => setShowDashboard(false)} />
  }

  const strengthMeta = getStrengthLabel(strength)
  const characterOptions = [
    { id: "uppercase", label: "Uppercase", description: "A-Z", checked: includeUppercase, onCheckedChange: setIncludeUppercase },
    { id: "lowercase", label: "Lowercase", description: "a-z", checked: includeLowercase, onCheckedChange: setIncludeLowercase },
    { id: "numbers", label: "Numbers", description: "0-9", checked: includeNumbers, onCheckedChange: setIncludeNumbers },
    { id: "symbols", label: "Symbols", description: "!@#$", checked: includeSymbols, onCheckedChange: setIncludeSymbols },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            opacity: 0.18,
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_62%)]" />
        <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-[-5rem] top-36 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      </div>

      {showScene ? (
        <PasswordScene
          strength={strength}
          className="pointer-events-none opacity-30 [mask-image:radial-gradient(circle_at_82%_24%,black_0%,black_22%,transparent_64%)]"
        />
      ) : null}

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/15 bg-background/78 px-4 py-2 shadow-lg shadow-primary/5 backdrop-blur-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Private Vault</div>
              <div className="font-serif text-2xl font-semibold tracking-tight text-primary">SecurePass</div>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="space-y-6 lg:space-y-8">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_24rem]">
            <Card className="rounded-[34px] border-primary/15 bg-background/78 shadow-[0_38px_110px_-50px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/15">Browser-only security</Badge>
                  <Badge variant="outline" className="rounded-full border-primary/15 bg-background/70 px-4 py-1.5 text-muted-foreground">Installable PWA</Badge>
                </div>

                <div className="mt-6 max-w-3xl space-y-4">
                  <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                    Generate strong passwords without leaving your browser.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                    SecurePass gives you a cleaner local-first workflow: create passwords instantly, label them, save
                    them to your vault, and reopen the app even when your connection drops.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <StatTile icon={Database} label="Saved" value={passwordStats.total.toString()} detail="Passwords stored in your local vault" />
                  <StatTile icon={Shield} label="Strong" value={passwordStats.strong.toString()} detail="Entries already marked as strong" className="bg-primary/7" />
                  <StatTile icon={LayoutDashboard} label="Workflow" value="Fast" detail="Generator, dashboard, and backup flow" />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={generatePassword} className="h-14 rounded-full px-7 text-base">
                    <Sparkles className="h-5 w-5" />
                    Generate Password
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setShowDashboard(true)} className="h-14 rounded-full border-primary/15 bg-background/78 px-7 text-base">
                    <LayoutDashboard className="h-5 w-5" />
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[34px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-52px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
              <CardHeader className="space-y-3">
                <Badge variant="outline" className="w-fit rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary">Why it feels better</Badge>
                <CardTitle className="text-2xl font-semibold tracking-tight">A calmer, faster password flow</CardTitle>
                <CardDescription className="text-base leading-7">
                  The page is designed to keep the generator central and the supporting information close at hand.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InsightRow icon={Shield} title="Local-first by default" description="Passwords are generated and stored in your browser, with no account or remote vault required." />
                <InsightRow icon={Database} title="Organized when you save" description="Label entries, assign categories, and jump into the dashboard whenever you want to manage the vault." />
                <InsightRow icon={CheckCircle2} title="Offline-friendly workspace" description="Install the app, reopen cached routes, and keep core interactions available with the service worker." />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr)_0.86fr]">
            <Card className="rounded-[34px] border-primary/15 bg-background/80 shadow-[0_38px_120px_-60px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
              <CardHeader className="space-y-3 border-b border-border/60 pb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <Badge variant="outline" className="w-fit rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary">Generator Workspace</Badge>
                    <CardTitle className="flex items-center gap-3 text-2xl tracking-tight">
                      <Lock className="h-5 w-5 text-primary" />
                      Build a password and save it when it looks right
                    </CardTitle>
                    <CardDescription className="max-w-2xl text-base leading-7">
                      Adjust the recipe, inspect the output, then send it to the local vault with a label and category.
                    </CardDescription>
                  </div>
                  <Badge className={cn("rounded-full px-4 py-1.5 text-sm text-white", strengthMeta.tone)}>
                    {strengthMeta.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                <div className="rounded-[26px] border border-primary/10 bg-background/78 p-4 sm:p-5">
                  <Label htmlFor="password" className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Generated Password
                  </Label>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      readOnly
                      className="h-14 flex-1 rounded-2xl border-primary/10 bg-background/80 px-4 font-mono text-base sm:text-lg"
                    />
                    <div className="grid grid-cols-3 gap-2 sm:flex">
                      <Button variant="outline" size="icon" className="h-14 w-full rounded-2xl border-primary/12 bg-background/80 sm:w-14" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon" className="h-14 w-full rounded-2xl border-primary/12 bg-background/80 sm:w-14" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-14 w-full rounded-2xl border-primary/12 bg-background/80 sm:w-14">
                            <Save className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Save Password</DialogTitle>
                            <DialogDescription>
                              Give your password a label and category so it is easy to identify later.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="label">Password Label</Label>
                              <Input id="label" placeholder="e.g., Gmail Account, Work WiFi..." value={passwordLabel} onChange={(event) => setPasswordLabel(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="category">Category (Optional)</Label>
                              <Select value={passwordCategory} onValueChange={setPasswordCategory}>
                                <SelectTrigger>
                                  <Tag className="mr-2 h-4 w-4" />
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.name}>
                                      <div className="flex items-center gap-2">
                                        <span>{category.icon}</span>
                                        {category.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="rounded-lg bg-muted p-3">
                              <p className="break-all font-mono text-sm">{password}</p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSavePassword}>Save Password</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
                  <div className="rounded-[26px] border border-primary/10 bg-background/78 p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <Label className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Password Strength</Label>
                      <Badge className={cn("rounded-full px-3 py-1 text-sm text-white", strengthMeta.tone)}>{strengthMeta.label}</Badge>
                    </div>
                    <Progress value={strength} className="h-3" />
                    <div className="mt-3 text-sm text-muted-foreground">Strength improves with longer length and a broader character mix.</div>
                  </div>

                  <div className="rounded-[26px] border border-primary/10 bg-background/78 p-4 sm:p-5">
                    <Label className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Length</Label>
                    <div className="mt-3 text-4xl font-semibold tracking-tight">{length[0]}</div>
                    <div className="mt-3">
                      <Slider value={length} onValueChange={setLength} max={128} min={4} step={1} className="w-full" />
                    </div>
                  </div>
                </div>

                <div className="rounded-[26px] border border-primary/10 bg-background/78 p-4 sm:p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <Label className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Character Types</Label>
                      <p className="mt-1 text-sm text-muted-foreground">Turn character groups on or off to shape the result.</p>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary">
                      {characterOptions.filter((option) => option.checked).length} active
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {characterOptions.map((option) => (
                      <ToggleTile key={option.id} {...option} />
                    ))}
                  </div>

                  <div className="mt-3 rounded-[22px] border border-border/70 bg-background/80 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-primary/5 hover:shadow-md">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="exclude-similar" className="text-sm font-semibold">Exclude similar characters</Label>
                        <p className="mt-1 text-sm text-muted-foreground">i, l, 1, L, o, 0, O</p>
                      </div>
                      <Switch id="exclude-similar" checked={excludeSimilar} onCheckedChange={setExcludeSimilar} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={generatePassword} className="h-14 flex-1 rounded-[24px] text-base" size="lg">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Generate New Password
                  </Button>
                  <Button variant="outline" onClick={() => setShowDashboard(true)} className="h-14 rounded-[24px] border-primary/15 bg-background/80 px-6 text-base">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Open Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[34px] border-primary/15 bg-card/80 shadow-[0_32px_100px_-60px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
                <CardHeader className="space-y-2">
                  <Badge variant="outline" className="w-fit rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary">Security Tips</Badge>
                  <CardTitle className="text-2xl tracking-tight">A tighter rule set makes stronger passwords</CardTitle>
                  <CardDescription className="text-base leading-7">
                    These are the habits worth keeping even after the generator gives you a strong result.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {SECURITY_TIPS.map((tip) => (
                    <SecurityTip key={tip} text={tip} />
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[34px] border-primary/15 bg-primary/7 shadow-[0_28px_84px_-56px_rgba(5,150,105,0.35)] backdrop-blur-2xl">
                <CardHeader className="space-y-2">
                  <Badge className="w-fit rounded-full bg-primary px-3 py-1 text-primary-foreground">Stored on this device</Badge>
                  <CardTitle className="text-2xl tracking-tight">Local-first vault, ready when you are</CardTitle>
                  <CardDescription className="text-base leading-7">
                    Saved passwords stay in your browser&apos;s local storage, and the PWA keeps the app available with
                    an offline fallback after you&apos;ve loaded it once.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-primary/15 bg-background/70 p-4">
                      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Categories</div>
                      <div className="mt-2 text-3xl font-semibold">{categories.length}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Ready for labels and organization</div>
                    </div>
                    <div className="rounded-[22px] border border-primary/15 bg-background/70 p-4">
                      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Access</div>
                      <div className="mt-2 text-3xl font-semibold">Offline</div>
                      <div className="mt-1 text-sm text-muted-foreground">Cached shell with install support</div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-primary/15 bg-background/70 p-4">
                    <div className="mb-2 font-semibold">Good next step</div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Save the current password with a label, then use the dashboard to organize entries, categories,
                      and exports in one place.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
