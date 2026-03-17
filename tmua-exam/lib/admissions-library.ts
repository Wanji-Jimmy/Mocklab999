import stepManifestRaw from '@/data/admissions/step-manifest.json'
import matManifestRaw from '@/data/admissions/mat-manifest.json'

export type AdmissionsMaterialItem = {
  id: string
  exam: 'step' | 'mat'
  title: string
  year: number | null
  category: string
  subcategory: string | null
  type: string
  sourceUrl: string
  publicUrl: string
  relativePath: string
  sizeBytes: number
}

export type AdmissionsManifest = {
  exam: 'step' | 'mat'
  sourcePage: string
  generatedAt: string
  count: number
  totalBytes: number
  items: AdmissionsMaterialItem[]
}

export const STEP_MANIFEST = stepManifestRaw as AdmissionsManifest
export const MAT_MANIFEST = matManifestRaw as AdmissionsManifest

export function formatLibraryLabel(value: string | null | undefined): string {
  if (!value) return 'General'
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

export function groupMaterials(items: AdmissionsMaterialItem[]) {
  const groups = new Map<string, { key: string; label: string; description: string; items: AdmissionsMaterialItem[] }>()

  items.forEach((item) => {
    const key = item.subcategory ? `${item.category}:${item.subcategory}` : item.category
    const label = item.subcategory
      ? `${formatLibraryLabel(item.category)} · ${formatLibraryLabel(item.subcategory)}`
      : formatLibraryLabel(item.category)

    const description = item.subcategory
      ? `${formatLibraryLabel(item.subcategory)} files inside ${formatLibraryLabel(item.category)}.`
      : `${formatLibraryLabel(item.category)} files.`

    const group = groups.get(key)
    if (!group) {
      groups.set(key, { key, label, description, items: [item] })
      return
    }
    group.items.push(item)
  })

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => {
        const yearA = a.year ?? 0
        const yearB = b.year ?? 0
        if (yearA !== yearB) return yearB - yearA
        return a.title.localeCompare(b.title)
      }),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function uniqueYears(items: AdmissionsMaterialItem[]) {
  return Array.from(new Set(items.map((item) => item.year).filter((year): year is number => Boolean(year)))).sort((a, b) => b - a)
}
