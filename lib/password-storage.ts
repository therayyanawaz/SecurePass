export interface StoredPassword {
  id: string
  password: string
  label: string
  strength: number
  length: number
  createdAt: string
  settings: {
    includeUppercase: boolean
    includeLowercase: boolean
    includeNumbers: boolean
    includeSymbols: boolean
    excludeSimilar: boolean
  }
  category?: string
}

export interface ExportOptions {
  format: "json" | "csv" | "txt"
  includePasswords: boolean
  includeMetadata: boolean
  selectedIds?: string[]
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
}

export interface PasswordStats {
  total: number
  weak: number
  fair: number
  good: number
  strong: number
}

export interface CategoryStats {
  [categoryName: string]: PasswordStats
}

export interface PasswordStorageSnapshot {
  passwords: StoredPassword[]
  categories: Category[]
  passwordStats: PasswordStats
  categoryStats: CategoryStats
}

const STORAGE_KEY = "securepass_passwords"
const CATEGORIES_KEY = "securepass_categories"
const MAX_PASSWORDS = 100

export const UNCATEGORIZED_CATEGORY_NAME = "Uncategorized"
export const DEFAULT_CATEGORY_ICON = "\u{1F4C1}"
export const DEFAULT_CATEGORY_COLOR = "#6b7280"

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt">[] = [
  { name: "Personal", color: "#10b981", icon: "\u{1F464}" },
  { name: "Work", color: "#3b82f6", icon: "\u{1F4BC}" },
  { name: "Social", color: "#8b5cf6", icon: "\u{1F310}" },
  { name: "Banking", color: "#f59e0b", icon: "\u{1F3E6}" },
  { name: "Shopping", color: "#ef4444", icon: "\u{1F6D2}" },
  { name: "Entertainment", color: "#ec4899", icon: "\u{1F3AC}" },
]

function isBrowser() {
  return typeof window !== "undefined"
}

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`
}

function readLegacyCookie(key: string): string | null {
  if (!isBrowser()) return null

  const prefix = `${key}=`
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix))

  return cookie ? cookie.substring(prefix.length) : null
}

function clearLegacyCookie(key: string) {
  if (!isBrowser()) return
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
}

function readStorageItem<T>(key: string): T | null {
  if (!isBrowser()) return null

  const localValue = window.localStorage.getItem(key)
  if (localValue) {
    try {
      return JSON.parse(localValue) as T
    } catch (error) {
      console.error(`Error parsing ${key} from localStorage:`, error)
      window.localStorage.removeItem(key)
    }
  }

  const legacyCookieValue = readLegacyCookie(key)
  if (!legacyCookieValue) return null

  try {
    const parsedValue = JSON.parse(decodeURIComponent(legacyCookieValue)) as T
    window.localStorage.setItem(key, JSON.stringify(parsedValue))
    clearLegacyCookie(key)
    return parsedValue
  } catch (error) {
    console.error(`Error migrating ${key} from cookies:`, error)
    clearLegacyCookie(key)
    return null
  }
}

function writeStorageItem<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    clearLegacyCookie(key)
    return true
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error)
    return false
  }
}

function createDefaultCategories(): Category[] {
  const createdAt = new Date().toISOString()
  return DEFAULT_CATEGORIES.map((category) => ({
    ...category,
    id: generateId(),
    createdAt,
  }))
}

function buildPasswordStats(passwords: StoredPassword[]): PasswordStats {
  const stats: PasswordStats = {
    total: passwords.length,
    weak: 0,
    fair: 0,
    good: 0,
    strong: 0,
  }

  passwords.forEach((password) => {
    if (password.strength < 30) stats.weak++
    else if (password.strength < 60) stats.fair++
    else if (password.strength < 80) stats.good++
    else stats.strong++
  })

  return stats
}

function buildCategoryStats(passwords: StoredPassword[], categories: Category[]): CategoryStats {
  const stats: CategoryStats = {
    [UNCATEGORIZED_CATEGORY_NAME]: {
      total: 0,
      weak: 0,
      fair: 0,
      good: 0,
      strong: 0,
    },
  }

  categories.forEach((category) => {
    stats[category.name] = {
      total: 0,
      weak: 0,
      fair: 0,
      good: 0,
      strong: 0,
    }
  })

  passwords.forEach((password) => {
    const categoryName = password.category || UNCATEGORIZED_CATEGORY_NAME
    const categoryStats = stats[categoryName] ?? {
      total: 0,
      weak: 0,
      fair: 0,
      good: 0,
      strong: 0,
    }

    categoryStats.total++

    if (password.strength < 30) categoryStats.weak++
    else if (password.strength < 60) categoryStats.fair++
    else if (password.strength < 80) categoryStats.good++
    else categoryStats.strong++

    stats[categoryName] = categoryStats
  })

  return stats
}

export function getStoredPasswords(): StoredPassword[] {
  const passwords = readStorageItem<StoredPassword[]>(STORAGE_KEY)
  return Array.isArray(passwords) ? passwords.slice(0, MAX_PASSWORDS) : []
}

export function savePasswordsToStorage(passwords: StoredPassword[]): boolean {
  return writeStorageItem(STORAGE_KEY, passwords.slice(0, MAX_PASSWORDS))
}

// Backward-compatible alias for older imports.
export function savePasswordsToCookies(passwords: StoredPassword[]): boolean {
  return savePasswordsToStorage(passwords)
}

export function savePassword(passwordData: Omit<StoredPassword, "id" | "createdAt">): boolean {
  const newPassword: StoredPassword = {
    ...passwordData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }

  return savePasswordsToStorage([newPassword, ...getStoredPasswords()])
}

export function deletePassword(id: string): boolean {
  return savePasswordsToStorage(getStoredPasswords().filter((password) => password.id !== id))
}

export function updatePassword(id: string, updates: Partial<StoredPassword>): boolean {
  return savePasswordsToStorage(
    getStoredPasswords().map((password) => (password.id === id ? { ...password, ...updates } : password)),
  )
}

export function getPasswordStats(): PasswordStats {
  return buildPasswordStats(getStoredPasswords())
}

export function getCategories(): Category[] {
  const categories = readStorageItem<Category[]>(CATEGORIES_KEY)
  if (Array.isArray(categories)) {
    return categories
  }

  const defaultCategories = createDefaultCategories()
  saveCategoriesToStorage(defaultCategories)
  return defaultCategories
}

export function saveCategoriesToStorage(categories: Category[]): boolean {
  return writeStorageItem(CATEGORIES_KEY, categories)
}

// Backward-compatible alias for older imports.
export function saveCategoriesToCookies(categories: Category[]): boolean {
  return saveCategoriesToStorage(categories)
}

export function getCategoryStats(): CategoryStats {
  const passwords = getStoredPasswords()
  const categories = getCategories()
  return buildCategoryStats(passwords, categories)
}

export function getPasswordStorageSnapshot(): PasswordStorageSnapshot {
  const passwords = getStoredPasswords()
  const categories = getCategories()

  return {
    passwords,
    categories,
    passwordStats: buildPasswordStats(passwords),
    categoryStats: buildCategoryStats(passwords, categories),
  }
}

export function clearAllPasswords(): boolean {
  if (!isBrowser()) return false

  try {
    window.localStorage.removeItem(STORAGE_KEY)
    clearLegacyCookie(STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error clearing passwords:", error)
    return false
  }
}

export function exportPasswords(options: ExportOptions): string {
  const passwords = getStoredPasswords()
  const dataToExport = options.selectedIds ? passwords.filter((password) => options.selectedIds?.includes(password.id)) : passwords

  switch (options.format) {
    case "json":
      return exportToJSON(dataToExport, options)
    case "csv":
      return exportToCSV(dataToExport, options)
    case "txt":
      return exportToTXT(dataToExport, options)
    default:
      throw new Error("Unsupported export format")
  }
}

function exportToJSON(passwords: StoredPassword[], options: ExportOptions): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    totalPasswords: passwords.length,
    passwords: passwords.map((password) => {
      const exportPassword: Record<string, unknown> = {
        id: password.id,
        label: password.label,
        createdAt: password.createdAt,
        strength: password.strength,
        length: password.length,
      }

      if (options.includePasswords) {
        exportPassword.password = password.password
      }

      if (options.includeMetadata) {
        exportPassword.settings = password.settings
        exportPassword.category = password.category
      }

      return exportPassword
    }),
  }

  return JSON.stringify(exportData, null, 2)
}

function exportToCSV(passwords: StoredPassword[], options: ExportOptions): string {
  const headers = ["Label", "Created At", "Strength", "Length"]

  if (options.includePasswords) {
    headers.push("Password")
  }

  if (options.includeMetadata) {
    headers.push("Category", "Uppercase", "Lowercase", "Numbers", "Symbols", "Exclude Similar")
  }

  const csvRows = [headers.join(",")]

  passwords.forEach((password) => {
    const row = [
      `"${password.label}"`,
      `"${new Date(password.createdAt).toLocaleDateString()}"`,
      password.strength.toString(),
      password.length.toString(),
    ]

    if (options.includePasswords) {
      row.push(`"${password.password}"`)
    }

    if (options.includeMetadata) {
      row.push(
        `"${password.category || ""}"`,
        password.settings.includeUppercase.toString(),
        password.settings.includeLowercase.toString(),
        password.settings.includeNumbers.toString(),
        password.settings.includeSymbols.toString(),
        password.settings.excludeSimilar.toString(),
      )
    }

    csvRows.push(row.join(","))
  })

  return csvRows.join("\n")
}

function exportToTXT(passwords: StoredPassword[], options: ExportOptions): string {
  const lines = [
    "SecurePass - Password Export",
    `Exported: ${new Date().toLocaleString()}`,
    `Total Passwords: ${passwords.length}`,
    "=".repeat(50),
    "",
  ]

  passwords.forEach((password, index) => {
    lines.push(`${index + 1}. ${password.label}`)
    lines.push(`   Created: ${new Date(password.createdAt).toLocaleDateString()}`)
    lines.push(`   Strength: ${password.strength}% (${getStrengthText(password.strength)})`)
    lines.push(`   Length: ${password.length} characters`)

    if (options.includePasswords) {
      lines.push(`   Password: ${password.password}`)
    }

    if (options.includeMetadata && password.category) {
      lines.push(`   Category: ${password.category}`)
    }

    lines.push("")
  })

  return lines.join("\n")
}

function getStrengthText(strength: number): string {
  if (strength < 30) return "Weak"
  if (strength < 60) return "Fair"
  if (strength < 80) return "Good"
  return "Strong"
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importPasswords(jsonContent: string): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [],
  }

  try {
    const importData = JSON.parse(jsonContent) as { passwords?: Array<Record<string, unknown>> }

    if (!importData.passwords || !Array.isArray(importData.passwords)) {
      result.errors.push("Invalid file format: passwords array not found")
      return result
    }

    const existingPasswords = getStoredPasswords()
    const existingLabels = new Set(existingPasswords.map((password) => password.label.toLowerCase()))
    const newPasswords: StoredPassword[] = []

    importData.passwords.forEach((importPassword, index) => {
      try {
        const label = typeof importPassword.label === "string" ? importPassword.label : ""
        const password = typeof importPassword.password === "string" ? importPassword.password : ""

        if (!label || !password) {
          result.errors.push(`Row ${index + 1}: Missing required fields (label or password)`)
          return
        }

        const normalizedLabel = label.toLowerCase()
        if (existingLabels.has(normalizedLabel)) {
          result.skipped++
          return
        }

        existingLabels.add(normalizedLabel)
        newPasswords.push({
          id: generateId(),
          label,
          password,
          strength: typeof importPassword.strength === "number" ? importPassword.strength : 0,
          length: typeof importPassword.length === "number" ? importPassword.length : password.length,
          createdAt:
            typeof importPassword.createdAt === "string" ? importPassword.createdAt : new Date().toISOString(),
          settings:
            typeof importPassword.settings === "object" && importPassword.settings
              ? (importPassword.settings as StoredPassword["settings"])
              : {
                  includeUppercase: true,
                  includeLowercase: true,
                  includeNumbers: true,
                  includeSymbols: true,
                  excludeSimilar: false,
                },
          category: typeof importPassword.category === "string" ? importPassword.category : undefined,
        })
        result.imported++
      } catch (error) {
        result.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    })

    if (newPasswords.length > 0) {
      result.success = savePasswordsToStorage([...newPasswords, ...existingPasswords])
      if (!result.success) {
        result.errors.push("Failed to save imported passwords")
      }
    } else {
      result.success = true
    }
  } catch (error) {
    result.errors.push(`Parse error: ${error instanceof Error ? error.message : "Invalid JSON format"}`)
  }

  return result
}

export function generateBackupFilename(format: string): string {
  const now = new Date()
  const dateStr = now.toISOString().split("T")[0]
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-")
  return `securepass-backup-${dateStr}-${timeStr}.${format}`
}

export function addCategory(categoryData: Omit<Category, "id" | "createdAt">): boolean {
  const existingCategories = getCategories()

  if (existingCategories.some((category) => category.name.toLowerCase() === categoryData.name.toLowerCase())) {
    return false
  }

  return saveCategoriesToStorage([
    ...existingCategories,
    {
      ...categoryData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    },
  ])
}

export function updateCategory(id: string, updates: Partial<Omit<Category, "id" | "createdAt">>): boolean {
  return saveCategoriesToStorage(
    getCategories().map((category) => (category.id === id ? { ...category, ...updates } : category)),
  )
}

export function deleteCategory(id: string): boolean {
  const existingCategories = getCategories()
  const categoryToDelete = existingCategories.find((category) => category.id === id)

  if (!categoryToDelete) return false

  const updatedPasswords = getStoredPasswords().map((password) =>
    password.category === categoryToDelete.name ? { ...password, category: undefined } : password,
  )

  if (!savePasswordsToStorage(updatedPasswords)) {
    return false
  }

  return saveCategoriesToStorage(existingCategories.filter((category) => category.id !== id))
}

export function getPasswordsByCategory(categoryName?: string): StoredPassword[] {
  const passwords = getStoredPasswords()

  if (!categoryName) return passwords
  if (categoryName === UNCATEGORIZED_CATEGORY_NAME) {
    return passwords.filter((password) => !password.category)
  }

  return passwords.filter((password) => password.category === categoryName)
}

export function bulkUpdatePasswordCategory(passwordIds: string[], categoryName?: string): boolean {
  const passwordIdSet = new Set(passwordIds)
  return savePasswordsToStorage(
    getStoredPasswords().map((password) =>
      passwordIdSet.has(password.id) ? { ...password, category: categoryName } : password,
    ),
  )
}
