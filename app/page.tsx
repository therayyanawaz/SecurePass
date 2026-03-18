"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Copy, Database, Eye, EyeOff, LayoutDashboard, Lock, RefreshCw, Save, Shield, Sparkles, Tag } from "lucide-react"
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

const COPYRIGHT_LABEL = `© ${new Date().getFullYear()} therayyanawaz`

type ToggleTileProps = {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
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

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield
  label: string
  value: string
}) {
  return (
    <div className="rounded-[22px] border border-primary/10 bg-background/78 px-4 py-3 shadow-lg shadow-primary/5 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
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
        <div className="absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_62%)]" />
        <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-[-5rem] top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {showScene ? (
        <PasswordScene
          strength={strength}
          className="pointer-events-none opacity-24 [mask-image:radial-gradient(circle_at_82%_24%,black_0%,black_18%,transparent_62%)]"
        />
      ) : null}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/15 bg-background/78 px-4 py-2 shadow-lg shadow-primary/5 backdrop-blur-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Private Vault</div>
              <div className="font-serif text-2xl font-semibold tracking-tight text-primary">SecurePass</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-full border-primary/15 bg-background/80 px-5">
              <Link href="/about">About SecurePass</Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-6">
          <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge variant="outline" className="rounded-full border-primary/15 bg-primary/8 px-4 py-1.5 text-primary">
                Generator Workspace
              </Badge>
              <h1 className="font-serif text-[clamp(3.2rem,8vw,5.8rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-balance">
                Strong passwords,
                <br />
                instantly usable.
              </h1>
              <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                Set the rules, generate a result, copy it fast, and save it only when you want it in your local vault.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <StatPill icon={Database} label="Saved" value={passwordStats.total.toString()} />
              <StatPill icon={Shield} label="Strong" value={passwordStats.strong.toString()} />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <Card className="rounded-[34px] border-primary/15 bg-background/80 shadow-[0_38px_120px_-60px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
              <CardHeader className="space-y-3 border-b border-border/60 pb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-3 font-serif text-[1.9rem] tracking-[-0.03em]">
                      <Lock className="h-5 w-5 text-primary" />
                      Generator Workspace
                    </CardTitle>
                    <CardDescription className="max-w-2xl text-base leading-7">
                      Choose the character rules, inspect the result, then copy or save it.
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
                        <DialogContent className="max-w-xl rounded-[32px] border-primary/15 bg-background/92 p-0 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
                          <div className="space-y-6 p-6 sm:p-7">
                            <DialogHeader className="space-y-3 text-left">
                              <Badge
                                variant="outline"
                                className="w-fit rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary"
                              >
                                Save to Vault
                              </Badge>
                              <div className="space-y-2">
                                <DialogTitle className="text-2xl tracking-tight">Save Password</DialogTitle>
                                <DialogDescription className="max-w-md text-sm leading-7">
                                  Add a label, choose a category if needed, and keep this password ready in your local vault.
                                </DialogDescription>
                              </div>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="rounded-[24px] border border-primary/10 bg-background/75 p-4">
                                <div className="space-y-2">
                                  <Label htmlFor="label" className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Password Label
                                  </Label>
                                  <Input
                                    id="label"
                                    placeholder="e.g., Gmail Account, Work WiFi..."
                                    value={passwordLabel}
                                    onChange={(event) => setPasswordLabel(event.target.value)}
                                    className="h-12 rounded-2xl border-primary/10 bg-background/85"
                                  />
                                </div>
                              </div>

                              <div className="rounded-[24px] border border-primary/10 bg-background/75 p-4">
                                <div className="space-y-2">
                                  <Label htmlFor="category" className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Category
                                  </Label>
                                  <Select value={passwordCategory} onValueChange={setPasswordCategory}>
                                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-background/85">
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
                              </div>

                              <div className="rounded-[24px] border border-primary/10 bg-primary/6 p-4">
                                <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Password Preview
                                </div>
                                <div className="rounded-[18px] border border-primary/10 bg-background/85 p-4">
                                  <p className="break-all font-mono text-sm sm:text-base">{password}</p>
                                </div>
                              </div>
                            </div>

                            <DialogFooter className="border-t border-border/60 pt-1 sm:pt-3">
                              <Button
                                variant="outline"
                                onClick={() => setShowSaveDialog(false)}
                                className="h-12 rounded-[18px] border-primary/15 bg-background/80 px-6"
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleSavePassword} className="h-12 rounded-[18px] px-6">
                                Save Password
                              </Button>
                            </DialogFooter>
                          </div>
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
                    <div className="mt-3 text-sm text-muted-foreground">Longer passwords with more character types score better.</div>
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
                      <p className="mt-1 text-sm text-muted-foreground">Switch the groups you want included in the password.</p>
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

                <Button onClick={generatePassword} className="h-14 w-full rounded-[24px] text-base" size="lg">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Generate New Password
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-[30px] border-primary/15 bg-card/80 shadow-[0_28px_84px_-56px_rgba(15,23,42,0.3)] backdrop-blur-2xl">
                <CardHeader className="space-y-2">
                  <CardTitle className="font-serif text-[1.7rem] tracking-[-0.03em]">Vault Access</CardTitle>
                  <CardDescription>Open the dashboard when you want to manage saved entries and categories.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full border-primary/15 bg-background/80 px-3 py-1 text-primary">
                      {categories.length} Categories
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-primary/15 bg-background/80 px-3 py-1 text-muted-foreground">
                      Local Vault
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Use the dashboard for labels, categories, imports, exports, and saved-password management.
                  </p>
                  <Button variant="outline" onClick={() => setShowDashboard(true)} className="h-12 w-full rounded-[20px] border-primary/15 bg-background/80">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Open Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[30px] border-primary/15 bg-card/80 shadow-[0_28px_84px_-56px_rgba(15,23,42,0.3)] backdrop-blur-2xl">
                <CardHeader className="space-y-2">
                  <CardTitle className="font-serif text-[1.7rem] tracking-[-0.03em]">Need details?</CardTitle>
                  <CardDescription>Privacy, offline support, and the broader product information live on the About page.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="h-12 w-full rounded-[20px] border-primary/15 bg-background/80">
                    <Link href="/about">Go to About</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>

        <footer className="mt-8 border-t border-border/60 pt-4">
          <p className="text-center text-sm tracking-[0.14em] text-muted-foreground/90 sm:text-right">
            {COPYRIGHT_LABEL}
          </p>
        </footer>
      </div>
    </div>
  )
}
