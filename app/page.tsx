"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, RefreshCw, Shield, Lock, Eye, EyeOff, Save, Database, LayoutDashboard, Tag } from "lucide-react"
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

  // Password generation logic
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

  // Password strength calculation
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

  const getStrengthLabel = (strength: number) => {
    if (strength < 30) return { label: "Weak", color: "bg-red-500" }
    if (strength < 60) return { label: "Fair", color: "bg-amber-500" }
    if (strength < 80) return { label: "Good", color: "bg-emerald-500" }
    return { label: "Strong", color: "bg-emerald-600" }
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

  return (
    <div className="min-h-screen bg-background">
      {/* 3D Background Scene */}
      {showScene ? <PasswordScene strength={strength} /> : null}

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold font-serif bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SecurePass
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Generate ultra-secure passwords with our advanced interface. No login required - your passwords are
              stored locally for instant access.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge variant="outline" className="text-sm">
                <Database className="h-3 w-3 mr-1" />
                {passwordStats.total} Saved
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Shield className="h-3 w-3 mr-1" />
                {passwordStats.strong} Strong
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Password Generator */}
            <Card className="backdrop-blur-sm bg-card/80 border-2 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password Generator
                </CardTitle>
                <CardDescription>Customize your password settings and generate secure passwords</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generated Password Display */}
                <div className="space-y-2">
                  <Label htmlFor="password">Generated Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      readOnly
                      className="font-mono text-lg"
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Save className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Password</DialogTitle>
                          <DialogDescription>
                            Give your password a label and category to easily identify it later.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="label">Password Label</Label>
                            <Input
                              id="label"
                              placeholder="e.g., Gmail Account, Work WiFi..."
                              value={passwordLabel}
                              onChange={(e) => setPasswordLabel(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Category (Optional)</Label>
                            <Select value={passwordCategory} onValueChange={setPasswordCategory}>
                              <SelectTrigger>
                                <Tag className="h-4 w-4 mr-2" />
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
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-mono break-all">{password}</p>
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

                {/* Password Strength */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Password Strength</Label>
                    <Badge variant="secondary" className={getStrengthLabel(strength).color}>
                      {getStrengthLabel(strength).label}
                    </Badge>
                  </div>
                  <Progress value={strength} className="h-3" />
                </div>

                {/* Length Slider */}
                <div className="space-y-2">
                  <Label>Length: {length[0]}</Label>
                  <Slider value={length} onValueChange={setLength} max={128} min={4} step={1} className="w-full" />
                </div>

                {/* Character Options */}
                <div className="space-y-4">
                  <Label>Character Types</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                      <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                      <Label htmlFor="lowercase">Lowercase (a-z)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                      <Label htmlFor="numbers">Numbers (0-9)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                      <Label htmlFor="symbols">Symbols (!@#$)</Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="exclude-similar" checked={excludeSimilar} onCheckedChange={setExcludeSimilar} />
                    <Label htmlFor="exclude-similar">Exclude similar characters (i, l, 1, L, o, 0, O)</Label>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="space-y-3">
                  <Button onClick={generatePassword} className="w-full text-lg py-6" size="lg">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Generate New Password
                  </Button>
                  <Button variant="outline" onClick={() => setShowDashboard(true)} className="w-full">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Open Password Dashboard ({passwordStats.total})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password Tips */}
            <Card className="backdrop-blur-sm bg-card/80 border-2 shadow-2xl">
              <CardHeader>
                <CardTitle>Security Tips</CardTitle>
                <CardDescription>Best practices for password security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm">Use at least 12 characters for better security</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm">Include a mix of uppercase, lowercase, numbers, and symbols</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm">Avoid using personal information or common words</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm">Use unique passwords for each account</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm">Store passwords securely and never share them</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2">Local Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    Your generated passwords stay in your browser's local storage. No account required, and existing
                    cookie-based data is migrated automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
