"use client"

import type React from "react"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Shield,
  BarChart3,
  Download,
  AlertTriangle,
  CheckCircle2,
  Upload,
  FileText,
  FileJson,
  FileSpreadsheet,
  Import,
  Plus,
  Edit,
  Tag,
  ArrowRight,
  Sparkles,
  Lock,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  deletePassword,
  clearAllPasswords,
  exportPasswords,
  downloadFile,
  importPasswords,
  generateBackupFilename,
  updatePassword,
  addCategory,
  updateCategory,
  deleteCategory,
  bulkUpdatePasswordCategory,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  getPasswordStorageSnapshot,
  type StoredPassword,
  type ExportOptions,
  type ImportResult,
  type Category,
  type CategoryStats,
} from "@/lib/password-storage"
import { ThemeToggle } from "@/components/theme-toggle"

interface PasswordDashboardProps {
  onClose: () => void
}

// Empty State Component
function EmptyStateSection({ onGeneratePassword }: { onGeneratePassword: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-primary/15 bg-card/78 px-6 py-10 shadow-[0_36px_120px_-72px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:px-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-4rem] top-[-5rem] h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-[-6rem] h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div className="space-y-6">
          <Badge variant="outline" className="rounded-full border-primary/15 bg-primary/8 px-4 py-1.5 text-primary">
            Vault ready
          </Badge>
          <div className="space-y-3">
            <h3 className="max-w-2xl font-serif text-[clamp(2.6rem,6vw,4.4rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-balance">
              Your saved passwords will live here.
            </h3>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Generate a password first, then come back here to search, organize, import, or export your local vault.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={onGeneratePassword} size="lg" className="h-14 rounded-[22px] px-6 text-base">
              <Sparkles className="mr-2 h-5 w-5" />
              Generate a password
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="inline-flex items-center gap-3 rounded-[22px] border border-primary/12 bg-background/72 px-4 py-3 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              No account, no remote vault, no waiting.
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[24px] border border-primary/12 bg-background/75 p-5">
            <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              Local-first
            </div>
            <p className="text-sm leading-6 text-foreground/90">Passwords stay in browser storage on this device unless you export them.</p>
          </div>
          <div className="rounded-[24px] border border-primary/12 bg-background/75 p-5">
            <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              Organized later
            </div>
            <p className="text-sm leading-6 text-foreground/90">Use categories and filters once you have a vault worth managing.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PasswordDashboard({ onClose }: PasswordDashboardProps) {
  const [passwords, setPasswords] = useState<StoredPassword[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({})
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [selectedPasswords, setSelectedPasswords] = useState<string[]>([])
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [sortBy, setSortBy] = useState<"date" | "strength" | "label">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [strengthFilter, setStrengthFilter] = useState<"all" | "weak" | "fair" | "good" | "strong">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showBulkCategoryDialog, setShowBulkCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", color: DEFAULT_CATEGORY_COLOR, icon: DEFAULT_CATEGORY_ICON })
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "json",
    includePasswords: true,
    includeMetadata: true,
  })
  const [importContent, setImportContent] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    weak: 0,
    fair: 0,
    good: 0,
    strong: 0,
  })
  const { toast } = useToast()
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase()
  const selectedPasswordSet = useMemo(() => new Set(selectedPasswords), [selectedPasswords])
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.name, category])), [categories])

  const handleGeneratePassword = () => {
    onClose() // Return to main password generator
    toast({
      title: "Let's generate your first password!",
      description: "Redirecting to the password generator...",
    })
  }

  const loadData = () => {
    const snapshot = getPasswordStorageSnapshot()
    setPasswords(snapshot.passwords)
    setCategories(snapshot.categories)
    setStats(snapshot.passwordStats)
    setCategoryStats(snapshot.categoryStats)
  }

  const filteredAndSortedPasswords = useMemo(() => {
    const filtered = passwords.filter((password) => {
      const matchesSearch =
        normalizedSearchTerm.length === 0 || password.label.toLowerCase().includes(normalizedSearchTerm)
      const matchesStrength =
        strengthFilter === "all" ||
        (strengthFilter === "weak" && password.strength < 30) ||
        (strengthFilter === "fair" && password.strength >= 30 && password.strength < 60) ||
        (strengthFilter === "good" && password.strength >= 60 && password.strength < 80) ||
        (strengthFilter === "strong" && password.strength >= 80)

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "uncategorized" && !password.category) ||
        password.category === categoryFilter

      return matchesSearch && matchesStrength && matchesCategory
    })

    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "strength":
          comparison = a.strength - b.strength
          break
        case "label":
          comparison = a.label.localeCompare(b.label)
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [passwords, normalizedSearchTerm, sortBy, sortOrder, strengthFilter, categoryFilter])

  const handleCopyPassword = async (password: string, label: string) => {
    try {
      await navigator.clipboard.writeText(password)
      toast({
        title: "Copied!",
        description: `Password "${label}" copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive",
      })
    }
  }

  const handleDeletePassword = (id: string, label: string) => {
    const success = deletePassword(id)
    if (success) {
      toast({
        title: "Deleted",
        description: `Password "${label}" deleted`,
      })
      loadData()
      setSelectedPasswords((prev) => prev.filter((selectedId) => selectedId !== id))
    } else {
      toast({
        title: "Error",
        description: "Failed to delete password",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePasswordCategory = (passwordId: string, categoryName?: string) => {
    const success = updatePassword(passwordId, { category: categoryName })
    if (success) {
      toast({
        title: "Updated",
        description: `Password category updated`,
      })
      loadData()
    } else {
      toast({
        title: "Error",
        description: "Failed to update password category",
        variant: "destructive",
      })
    }
  }

  const handleBulkCategoryUpdate = (categoryName?: string) => {
    const success = bulkUpdatePasswordCategory(selectedPasswords, categoryName)
    if (success) {
      toast({
        title: "Updated",
        description: `${selectedPasswords.length} password(s) updated`,
      })
      loadData()
      setSelectedPasswords([])
      setShowBulkCategoryDialog(false)
    } else {
      toast({
        title: "Error",
        description: "Failed to update password categories",
        variant: "destructive",
      })
    }
  }

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    const success = addCategory(newCategory)
    if (success) {
      toast({
        title: "Added",
        description: `Category "${newCategory.name}" created`,
      })
      setNewCategory({ name: "", color: DEFAULT_CATEGORY_COLOR, icon: DEFAULT_CATEGORY_ICON })
      setShowCategoryDialog(false)
      loadData()
    } else {
      toast({
        title: "Error",
        description: "Category name already exists",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name.trim()) return

    const success = updateCategory(editingCategory.id, {
      name: newCategory.name,
      color: newCategory.color,
      icon: newCategory.icon,
    })

    if (success) {
      toast({
        title: "Updated",
        description: `Category "${newCategory.name}" updated`,
      })
      setEditingCategory(null)
      setNewCategory({ name: "", color: DEFAULT_CATEGORY_COLOR, icon: DEFAULT_CATEGORY_ICON })
      setShowCategoryDialog(false)
      loadData()
    } else {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    const success = deleteCategory(categoryId)
    if (success) {
      toast({
        title: "Deleted",
        description: `Category "${categoryName}" deleted`,
      })
      loadData()
    } else {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({
      name: category.name,
      color: category.color,
      icon: category.icon,
    })
    setShowCategoryDialog(true)
  }

  const openAddCategory = () => {
    setEditingCategory(null)
    setNewCategory({ name: "", color: DEFAULT_CATEGORY_COLOR, icon: DEFAULT_CATEGORY_ICON })
    setShowCategoryDialog(true)
  }

  const handleBulkDelete = () => {
    let successCount = 0
    selectedPasswords.forEach((id) => {
      if (deletePassword(id)) {
        successCount++
      }
    })

    if (successCount > 0) {
      toast({
        title: "Deleted",
        description: `${successCount} password(s) deleted`,
      })
      loadData()
      setSelectedPasswords([])
    }
  }

  const handleClearAll = () => {
    const success = clearAllPasswords()
    if (success) {
      toast({
        title: "Cleared",
        description: "All passwords have been deleted",
      })
      loadData()
      setSelectedPasswords([])
    } else {
      toast({
        title: "Error",
        description: "Failed to clear passwords",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    try {
      const options: ExportOptions = {
        ...exportOptions,
        selectedIds: selectedPasswords.length > 0 ? selectedPasswords : undefined,
      }

      const content = exportPasswords(options)
      const filename = generateBackupFilename(exportOptions.format)

      let mimeType = "text/plain"
      switch (exportOptions.format) {
        case "json":
          mimeType = "application/json"
          break
        case "csv":
          mimeType = "text/csv"
          break
        case "txt":
          mimeType = "text/plain"
          break
      }

      downloadFile(content, filename, mimeType)

      const count = selectedPasswords.length > 0 ? selectedPasswords.length : passwords.length
      toast({
        title: "Export Complete",
        description: `${count} password(s) exported as ${exportOptions.format.toUpperCase()}`,
      })

      setShowExportDialog(false)
      setSelectedPasswords([])
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const handleImport = () => {
    if (!importContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste the backup content",
        variant: "destructive",
      })
      return
    }

    try {
      const result: ImportResult = importPasswords(importContent)

      if (result.success) {
        loadData()
        toast({
          title: "Import Complete",
          description: `${result.imported} password(s) imported, ${result.skipped} skipped`,
        })

      } else {
        toast({
          title: "Import Failed",
          description: result.errors[0] || "Unknown error occurred",
          variant: "destructive",
        })
      }

      setShowImportDialog(false)
      setImportContent("")
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid backup format",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportContent(content)
    }
    reader.readAsText(file)
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleSelectPassword = (id: string) => {
    setSelectedPasswords((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]))
  }

  const selectAllPasswords = () => {
    if (selectedPasswords.length === filteredAndSortedPasswords.length) {
      setSelectedPasswords([])
    } else {
      setSelectedPasswords(filteredAndSortedPasswords.map((p) => p.id))
    }
  }

  const getCategoryColor = (categoryName?: string) => {
    if (!categoryName) return DEFAULT_CATEGORY_COLOR
    return categoryMap.get(categoryName)?.color || DEFAULT_CATEGORY_COLOR
  }

  const getCategoryIcon = (categoryName?: string) => {
    if (!categoryName) return DEFAULT_CATEGORY_ICON
    return categoryMap.get(categoryName)?.icon || DEFAULT_CATEGORY_ICON
  }

  const getStrengthLabel = (strength: number) => {
    if (strength < 30) return { label: "Weak", color: "bg-red-500", textColor: "text-red-700" }
    if (strength < 60) return { label: "Fair", color: "bg-amber-500", textColor: "text-amber-700" }
    if (strength < 80) return { label: "Good", color: "bg-emerald-500", textColor: "text-emerald-700" }
    return { label: "Strong", color: "bg-emerald-600", textColor: "text-emerald-700" }
  }

  const getPasswordAge = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const securityScore =
    stats.total > 0
      ? Math.round(((stats.strong * 100 + stats.good * 75 + stats.fair * 50 + stats.weak * 25) / (stats.total * 100)) * 100)
      : 0

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_62%)]" />
        <div className="absolute left-[-7rem] top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-20 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="fixed right-4 top-4 z-40">
        <ThemeToggle />
      </div>

      <div className="relative z-10">
        <div className="sticky top-0 z-30 border-b border-border/70 bg-background/82 backdrop-blur-2xl">
          <div className="mx-auto max-w-6xl px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-primary/15 bg-primary/8 px-4 py-1.5 text-primary">
                    Vault workspace
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-primary/15 bg-background/80 px-3 py-1 text-muted-foreground">
                    {stats.total} saved
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-primary/15 bg-background/80 px-3 py-1 text-muted-foreground">
                    {securityScore}% secure
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[0.96] tracking-[-0.04em]">
                    Password dashboard
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Search saved entries, organize categories, and move your local vault in or out when needed.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-[18px] px-4">
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-[32px]">
                    <DialogHeader className="space-y-2">
                      <DialogTitle>Import passwords</DialogTitle>
                      <DialogDescription>Upload a SecurePass backup or paste JSON content to restore entries into this device.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-primary/10 bg-background/72 p-4">
                        <div className="space-y-2">
                          <Label htmlFor="file-upload">Upload backup file</Label>
                          <Input id="file-upload" type="file" accept=".json" onChange={handleFileUpload} />
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-primary/10 bg-background/72 p-4">
                        <div className="space-y-2">
                          <Label htmlFor="import-content">Paste backup content</Label>
                          <Textarea
                            id="import-content"
                            placeholder="Paste your backup JSON content here..."
                            value={importContent}
                            onChange={(e) => setImportContent(e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleImport}>
                        <Import className="mr-2 h-4 w-4" />
                        Import passwords
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-[18px] px-4">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[32px]">
                    <DialogHeader className="space-y-2">
                      <DialogTitle>Export passwords</DialogTitle>
                      <DialogDescription>
                        {selectedPasswords.length > 0
                          ? `Export ${selectedPasswords.length} selected password(s)`
                          : `Export all ${passwords.length} password(s)`}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-primary/10 bg-background/72 p-4">
                        <div className="space-y-2">
                          <Label>Export format</Label>
                          <Select
                            value={exportOptions.format}
                            onValueChange={(value: any) => setExportOptions((prev) => ({ ...prev, format: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="json">
                                <div className="flex items-center gap-2">
                                  <FileJson className="h-4 w-4" />
                                  JSON (recommended)
                                </div>
                              </SelectItem>
                              <SelectItem value="csv">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className="h-4 w-4" />
                                  CSV spreadsheet
                                </div>
                              </SelectItem>
                              <SelectItem value="txt">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  TXT readable copy
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-primary/10 bg-background/72 p-4">
                        <div className="space-y-3">
                          <Label>Export options</Label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-4 rounded-[18px] border border-border/70 bg-background/80 px-4 py-3">
                              <div>
                                <p className="text-sm font-medium">Include actual passwords</p>
                                <p className="text-xs text-muted-foreground">Turn off for a metadata-only export.</p>
                              </div>
                              <Switch
                                id="include-passwords"
                                checked={exportOptions.includePasswords}
                                onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includePasswords: checked }))}
                              />
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-[18px] border border-border/70 bg-background/80 px-4 py-3">
                              <div>
                                <p className="text-sm font-medium">Include settings and metadata</p>
                                <p className="text-xs text-muted-foreground">Keep labels, categories, and generator settings.</p>
                              </div>
                              <Switch
                                id="include-metadata"
                                checked={exportOptions.includeMetadata}
                                onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includeMetadata: checked }))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {!exportOptions.includePasswords && (
                        <div className="rounded-[22px] border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="mr-2 inline h-4 w-4" />
                          This export will not include passwords, so it cannot fully restore the vault later.
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export vault
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={onClose} className="h-11 rounded-[18px] px-4">
                  <X className="mr-2 h-4 w-4" />
                  Back to generator
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <div className="sticky top-[7.3rem] z-20 pb-1">
              <div className="rounded-[28px] border border-primary/12 bg-card/72 p-2 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 shadow-none sm:grid-cols-4">
                  <TabsTrigger value="overview" className="min-h-11 px-3 py-2.5 text-xs sm:text-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="passwords" className="min-h-11 px-3 py-2.5 text-xs sm:text-sm">
                    <span className="hidden sm:inline">All </span>Passwords
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="min-h-11 px-3 py-2.5 text-xs sm:text-sm">
                    Categories
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="min-h-11 px-3 py-2.5 text-xs sm:text-sm">
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6">
              {stats.total === 0 ? (
                <EmptyStateSection onGeneratePassword={handleGeneratePassword} />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Card className="border-primary/12 bg-background/80">
                      <CardContent className="p-5">
                        <div className="mb-4 flex items-center gap-2 text-primary">
                          <Shield className="h-4 w-4" />
                          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Saved</span>
                        </div>
                        <div className="text-4xl font-semibold tracking-tight">{stats.total}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-500/18 bg-background/80">
                      <CardContent className="p-5">
                        <div className="mb-4 flex items-center gap-2 text-red-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Weak</span>
                        </div>
                        <div className="text-4xl font-semibold tracking-tight text-red-600 dark:text-red-400">{stats.weak}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-500/18 bg-background/80">
                      <CardContent className="p-5">
                        <div className="mb-4 flex items-center gap-2 text-amber-500">
                          <div className="h-3.5 w-3.5 rounded-full bg-amber-500" />
                          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Fair</span>
                        </div>
                        <div className="text-4xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">{stats.fair}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-500/18 bg-background/80">
                      <CardContent className="p-5">
                        <div className="mb-4 flex items-center gap-2 text-emerald-500">
                          <div className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Good</span>
                        </div>
                        <div className="text-4xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.good}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/18 bg-primary/6">
                      <CardContent className="p-5">
                        <div className="mb-4 flex items-center gap-2 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Strong</span>
                        </div>
                        <div className="text-4xl font-semibold tracking-tight text-primary">{stats.strong}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card className="rounded-[30px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.34)]">
                      <CardHeader className="space-y-2">
                        <CardTitle className="font-serif text-[2rem] tracking-[-0.03em]">Category overview</CardTitle>
                        <CardDescription>Password distribution across the vault.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {Object.entries(categoryStats).map(([categoryName, categoryStat]) => (
                            <div
                              key={categoryName}
                              className="rounded-[24px] border border-primary/12 bg-background/78 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/8"
                            >
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-lg">
                                    {getCategoryIcon(categoryName === "Uncategorized" ? undefined : categoryName)}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{categoryName}</h4>
                                    <p className="text-sm text-muted-foreground">{categoryStat.total} saved entries</p>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  style={{
                                    backgroundColor: `${getCategoryColor(categoryName === "Uncategorized" ? undefined : categoryName)}20`,
                                    borderColor: getCategoryColor(categoryName === "Uncategorized" ? undefined : categoryName),
                                  }}
                                >
                                  {Math.round(
                                    categoryStat.total > 0
                                      ? ((categoryStat.strong * 100 + categoryStat.good * 75 + categoryStat.fair * 50 + categoryStat.weak * 25) /
                                          (categoryStat.total * 100)) *
                                          100
                                      : 0,
                                  )}
                                  %
                                </Badge>
                              </div>
                              <Progress
                                value={
                                  categoryStat.total > 0
                                    ? ((categoryStat.strong * 100 + categoryStat.good * 75 + categoryStat.fair * 50 + categoryStat.weak * 25) /
                                        (categoryStat.total * 100)) *
                                      100
                                    : 0
                                }
                                className="h-2.5"
                              />
                              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-background/80 px-3 py-1 text-emerald-600 dark:text-emerald-400">
                                  Strong {categoryStat.strong}
                                </span>
                                <span className="rounded-full bg-background/80 px-3 py-1 text-emerald-500 dark:text-emerald-300">
                                  Good {categoryStat.good}
                                </span>
                                <span className="rounded-full bg-background/80 px-3 py-1 text-amber-600 dark:text-amber-300">
                                  Fair {categoryStat.fair}
                                </span>
                                <span className="rounded-full bg-background/80 px-3 py-1 text-red-600 dark:text-red-300">
                                  Weak {categoryStat.weak}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[30px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.34)]">
                      <CardHeader className="space-y-2">
                        <CardTitle className="font-serif text-[2rem] tracking-[-0.03em]">Recent passwords</CardTitle>
                        <CardDescription>The last five entries saved into your local vault.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {passwords.slice(0, 5).map((password) => (
                          <div
                            key={password.id}
                            className="rounded-[22px] border border-primary/12 bg-background/78 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{getCategoryIcon(password.category)}</span>
                                  <h4 className="truncate font-medium">{password.label}</h4>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">{getPasswordAge(password.createdAt)}</p>
                              </div>
                              <Badge variant="secondary" className={getStrengthLabel(password.strength).color}>
                                {getStrengthLabel(password.strength).label}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              {password.category ? (
                                <Badge
                                  variant="outline"
                                  style={{
                                    backgroundColor: `${getCategoryColor(password.category)}20`,
                                    borderColor: getCategoryColor(password.category),
                                  }}
                                >
                                  {password.category}
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">Uncategorized</span>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleCopyPassword(password.password, password.label)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="passwords" className="space-y-6">
              <div className="rounded-[30px] border border-primary/12 bg-card/78 p-4 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.34)] backdrop-blur-2xl">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_10rem_11rem]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search saved passwords"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-11 pl-11"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full">
                      <Tag className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
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
                  <Select value={strengthFilter} onValueChange={(value: any) => setStrengthFilter(value)}>
                    <SelectTrigger className="w-full">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All strengths</SelectItem>
                      <SelectItem value="weak">Weak</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split("-")
                      setSortBy(field as any)
                      setSortOrder(order as any)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      {sortOrder === "asc" ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest first</SelectItem>
                      <SelectItem value="date-asc">Oldest first</SelectItem>
                      <SelectItem value="strength-desc">Strongest first</SelectItem>
                      <SelectItem value="strength-asc">Weakest first</SelectItem>
                      <SelectItem value="label-asc">A to Z</SelectItem>
                      <SelectItem value="label-desc">Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedPasswords.length > 0 && (
                <div className="flex flex-col gap-3 rounded-[24px] border border-primary/12 bg-primary/6 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium">{selectedPasswords.length} password(s) selected</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete selected
                    </Button>
                    <Dialog open={showBulkCategoryDialog} onOpenChange={setShowBulkCategoryDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Tag className="mr-1 h-3 w-3" />
                          Set category
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[30px]">
                        <DialogHeader>
                          <DialogTitle>Set category for selected passwords</DialogTitle>
                          <DialogDescription>Choose a category for {selectedPasswords.length} selected password(s).</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select onValueChange={(value) => handleBulkCategoryUpdate(value === "none" ? undefined : value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No category</SelectItem>
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
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowBulkCategoryDialog(false)}>
                            Cancel
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                      <Download className="mr-1 h-3 w-3" />
                      Export selected
                    </Button>
                  </div>
                </div>
              )}

              <Card className="rounded-[30px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.34)]">
                <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="font-serif text-[2rem] tracking-[-0.03em]">Saved passwords</CardTitle>
                    <CardDescription>{filteredAndSortedPasswords.length} result(s) in the current view.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllPasswords}>
                      {selectedPasswords.length === filteredAndSortedPasswords.length ? "Deselect all" : "Select all"}
                    </Button>
                    {passwords.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={handleClearAll}>
                        Clear all
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredAndSortedPasswords.map((password) => (
                      <div
                        key={password.id}
                        className="grid gap-4 rounded-[24px] border border-primary/12 bg-background/78 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/8 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
                      >
                        <div className="pt-1">
                          <Checkbox
                            checked={selectedPasswordSet.has(password.id)}
                            onCheckedChange={() => toggleSelectPassword(password.id)}
                          />
                        </div>

                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm">{getCategoryIcon(password.category)}</span>
                            <h4 className="min-w-0 flex-1 truncate font-medium">{password.label}</h4>
                            <Badge variant="secondary" className={getStrengthLabel(password.strength).color}>
                              {getStrengthLabel(password.strength).label}
                            </Badge>
                            {password.category ? (
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: `${getCategoryColor(password.category)}20`,
                                  borderColor: getCategoryColor(password.category),
                                }}
                              >
                                {password.category}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                                No category
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {getPasswordAge(password.createdAt)}
                            </span>
                            <span>{password.length} characters</span>
                          </div>

                          <Input
                            type={showPasswords[password.id] ? "text" : "password"}
                            value={password.password}
                            readOnly
                            className="font-mono text-sm"
                          />

                          <Select
                            value={password.category || "none"}
                            onValueChange={(value) => handleUpdatePasswordCategory(password.id, value === "none" ? undefined : value)}
                          >
                            <SelectTrigger className="w-full sm:w-56">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No category</SelectItem>
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

                        <div className="flex items-start gap-2 lg:flex-col">
                          <Button variant="outline" size="sm" onClick={() => togglePasswordVisibility(password.id)}>
                            {showPasswords[password.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCopyPassword(password.password, password.label)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeletePassword(password.id, password.label)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {filteredAndSortedPasswords.length === 0 && (
                      <div className="rounded-[24px] border border-dashed border-border/80 bg-background/72 px-6 py-12 text-center">
                        <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium">No passwords match this view</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Adjust the search query or relax the filters to see more entries.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              {categories.length === 0 ? (
                <Card className="rounded-[32px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.34)]">
                  <CardContent className="p-8 sm:p-12">
                    <div className="mx-auto max-w-2xl text-center">
                      <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Tag className="h-8 w-8" />
                      </div>
                      <h3 className="font-serif text-[clamp(2.3rem,5vw,3.8rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
                        Categories keep the vault readable.
                      </h3>
                      <p className="mt-3 text-base leading-8 text-muted-foreground">
                        Create groups like Work, Personal, Finance, or Devices so saved passwords stay easier to scan later.
                      </p>
                      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Button onClick={handleGeneratePassword} variant="outline" className="h-12 rounded-[18px] px-5">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate first
                        </Button>
                        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                          <DialogTrigger asChild>
                            <Button onClick={openAddCategory} className="h-12 rounded-[18px] px-5">
                              <Plus className="mr-2 h-4 w-4" />
                              Create category
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[30px]">
                            <DialogHeader>
                              <DialogTitle>Add new category</DialogTitle>
                              <DialogDescription>Create a new category to organize your saved passwords.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="category-name-empty">Category name</Label>
                                <Input
                                  id="category-name-empty"
                                  placeholder="e.g., Work, Personal, Banking..."
                                  value={newCategory.name}
                                  onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="category-icon-empty">Icon</Label>
                                <Input
                                  id="category-icon-empty"
                                  placeholder={DEFAULT_CATEGORY_ICON}
                                  value={newCategory.icon}
                                  onChange={(e) => setNewCategory((prev) => ({ ...prev, icon: e.target.value }))}
                                  maxLength={2}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="category-color-empty">Color</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="category-color-empty"
                                    type="color"
                                    value={newCategory.color}
                                    onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                                    className="h-11 w-16 rounded-2xl p-1"
                                  />
                                  <Input
                                    value={newCategory.color}
                                    onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                                    placeholder="#10b981"
                                  />
                                </div>
                              </div>
                              <div className="rounded-[22px] border border-primary/10 bg-background/72 p-4">
                                <p className="mb-2 text-sm text-muted-foreground">Preview</p>
                                <Badge
                                  variant="outline"
                                  style={{ backgroundColor: `${newCategory.color}20`, borderColor: newCategory.color }}
                                >
                                  <span className="mr-1">{newCategory.icon}</span>
                                  {newCategory.name || "Category name"}
                                </Badge>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddCategory}>Add category</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-[32px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.34)]">
                  <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="font-serif text-[2rem] tracking-[-0.03em]">Manage categories</CardTitle>
                      <CardDescription>Organize the vault with labels that match how you actually use it.</CardDescription>
                    </div>
                    <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                      <DialogTrigger asChild>
                        <Button onClick={openAddCategory} className="h-11 rounded-[18px] px-5">
                          <Plus className="mr-2 h-4 w-4" />
                          Add category
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[30px]">
                        <DialogHeader>
                          <DialogTitle>{editingCategory ? "Edit category" : "Add new category"}</DialogTitle>
                          <DialogDescription>
                            {editingCategory ? "Update the category details." : "Create a new category to organize saved passwords."}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="category-name">Category name</Label>
                            <Input
                              id="category-name"
                              placeholder="e.g., Work, Personal, Banking..."
                              value={newCategory.name}
                              onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category-icon">Icon</Label>
                            <Input
                              id="category-icon"
                              placeholder={DEFAULT_CATEGORY_ICON}
                              value={newCategory.icon}
                              onChange={(e) => setNewCategory((prev) => ({ ...prev, icon: e.target.value }))}
                              maxLength={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category-color">Color</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="category-color"
                                type="color"
                                value={newCategory.color}
                                onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                                className="h-11 w-16 rounded-2xl p-1"
                              />
                              <Input
                                value={newCategory.color}
                                onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                                placeholder="#10b981"
                              />
                            </div>
                          </div>
                          <div className="rounded-[22px] border border-primary/10 bg-background/72 p-4">
                            <p className="mb-2 text-sm text-muted-foreground">Preview</p>
                            <Badge
                              variant="outline"
                              style={{ backgroundColor: `${newCategory.color}20`, borderColor: newCategory.color }}
                            >
                              <span className="mr-1">{newCategory.icon}</span>
                              {newCategory.name || "Category name"}
                            </Badge>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
                            {editingCategory ? "Update" : "Add"} category
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {categories.map((category) => (
                        <Card key={category.id} className="border-primary/12 bg-background/78 p-6">
                          <div className="mb-5 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg"
                                style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}` }}
                              >
                                {category.icon}
                              </div>
                              <div>
                                <h4 className="font-medium">{category.name}</h4>
                                <p className="mt-1 text-xs text-muted-foreground">Created {getPasswordAge(category.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditCategory(category)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id, category.name)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <Badge
                                variant="outline"
                                style={{ backgroundColor: `${category.color}20`, borderColor: category.color }}
                              >
                                {categoryStats[category.name]?.total || 0} passwords
                              </Badge>
                              <span className="text-sm text-muted-foreground">{categoryStats[category.name]?.strong || 0} strong</span>
                            </div>
                            <Progress
                              value={
                                categoryStats[category.name]?.total
                                  ? (categoryStats[category.name].strong / categoryStats[category.name].total) * 100
                                  : 0
                              }
                              className="h-2.5"
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {stats.total === 0 ? (
                <Card className="rounded-[32px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.34)]">
                  <CardContent className="p-8 sm:p-12">
                    <div className="mx-auto max-w-2xl text-center">
                      <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <BarChart3 className="h-8 w-8" />
                      </div>
                      <h3 className="font-serif text-[clamp(2.3rem,5vw,3.8rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
                        Analytics appear after the first save.
                      </h3>
                      <p className="mt-3 text-base leading-8 text-muted-foreground">
                        Once passwords are saved, SecurePass will show a live security score and strength breakdown across your vault.
                      </p>
                      <div className="mt-8">
                        <Button onClick={handleGeneratePassword} variant="outline" className="h-12 rounded-[18px] px-5">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate a password
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="rounded-[32px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.34)]">
                    <CardHeader className="space-y-2">
                      <CardTitle className="flex items-center gap-2 font-serif text-[2rem] tracking-[-0.03em]">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Security analytics
                      </CardTitle>
                      <CardDescription>Strength distribution and recommendations for your current vault.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
                      <div className="rounded-[26px] border border-primary/12 bg-background/78 p-5">
                        <div className="mb-3 flex items-end justify-between gap-3">
                          <div>
                            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Overall score</div>
                            <div className="mt-2 text-5xl font-semibold tracking-tight">{securityScore}%</div>
                          </div>
                          <Badge variant="outline" className="rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary">
                            {stats.strong} strong
                          </Badge>
                        </div>
                        <Progress value={securityScore} className="h-3" />
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[20px] border border-border/70 bg-background/80 px-4 py-3 text-sm">
                            <div className="text-muted-foreground">Strong</div>
                            <div className="mt-1 font-medium text-emerald-600 dark:text-emerald-400">
                              {stats.strong} ({stats.total > 0 ? Math.round((stats.strong / stats.total) * 100) : 0}%)
                            </div>
                          </div>
                          <div className="rounded-[20px] border border-border/70 bg-background/80 px-4 py-3 text-sm">
                            <div className="text-muted-foreground">Good</div>
                            <div className="mt-1 font-medium text-emerald-500 dark:text-emerald-300">
                              {stats.good} ({stats.total > 0 ? Math.round((stats.good / stats.total) * 100) : 0}%)
                            </div>
                          </div>
                          <div className="rounded-[20px] border border-border/70 bg-background/80 px-4 py-3 text-sm">
                            <div className="text-muted-foreground">Fair</div>
                            <div className="mt-1 font-medium text-amber-600 dark:text-amber-300">
                              {stats.fair} ({stats.total > 0 ? Math.round((stats.fair / stats.total) * 100) : 0}%)
                            </div>
                          </div>
                          <div className="rounded-[20px] border border-border/70 bg-background/80 px-4 py-3 text-sm">
                            <div className="text-muted-foreground">Weak</div>
                            <div className="mt-1 font-medium text-red-600 dark:text-red-300">
                              {stats.weak} ({stats.total > 0 ? Math.round((stats.weak / stats.total) * 100) : 0}%)
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-[24px] border border-primary/12 bg-background/78 p-4">
                          <div className="mb-2 text-sm font-medium">Recommendations</div>
                          <div className="space-y-3 text-sm leading-6">
                            {stats.weak > 0 && (
                              <div className="flex items-start gap-2 text-red-600 dark:text-red-300">
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <span>Replace {stats.weak} weak password{stats.weak > 1 ? "s" : ""} soon.</span>
                              </div>
                            )}
                            {stats.fair > 0 && (
                              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-300">
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <span>Strengthen {stats.fair} fair password{stats.fair > 1 ? "s" : ""} when possible.</span>
                              </div>
                            )}
                            {stats.strong > stats.total * 0.8 && (
                              <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-300">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <span>Your vault is already in a strong range.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[32px] border-primary/15 bg-card/80 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.34)]">
                    <CardHeader className="space-y-2">
                      <CardTitle className="font-serif text-[2rem] tracking-[-0.03em]">Category security analysis</CardTitle>
                      <CardDescription>How each category contributes to the vault’s overall quality.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(categoryStats).map(([categoryName, categoryStat]) => (
                          <div
                            key={categoryName}
                            className="rounded-[24px] border border-primary/12 bg-background/78 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                          >
                            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-lg">
                                  {getCategoryIcon(categoryName === "Uncategorized" ? undefined : categoryName)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{categoryName}</h4>
                                  <p className="text-sm text-muted-foreground">{categoryStat.total} password(s)</p>
                                </div>
                                <Badge
                                  variant="outline"
                                  style={{
                                    backgroundColor: `${getCategoryColor(categoryName === "Uncategorized" ? undefined : categoryName)}20`,
                                    borderColor: getCategoryColor(categoryName === "Uncategorized" ? undefined : categoryName),
                                  }}
                                >
                                  {Math.round(
                                    categoryStat.total > 0
                                      ? ((categoryStat.strong * 100 + categoryStat.good * 75 + categoryStat.fair * 50 + categoryStat.weak * 25) /
                                          (categoryStat.total * 100)) *
                                          100
                                      : 0,
                                  )}
                                  % secure
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {categoryStat.strong} strong, {categoryStat.good} good, {categoryStat.fair} fair, {categoryStat.weak} weak
                              </div>
                            </div>
                            <Progress
                              value={
                                categoryStat.total > 0
                                  ? ((categoryStat.strong * 100 + categoryStat.good * 75 + categoryStat.fair * 50 + categoryStat.weak * 25) /
                                      (categoryStat.total * 100)) *
                                    100
                                  : 0
                              }
                              className="h-2.5"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
  )
}


