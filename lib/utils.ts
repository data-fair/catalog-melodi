import type { MelodiDataset } from '#types'
import AdmZip from 'adm-zip'
import path from 'path'

export const getLanguageContent = (array: MelodiDataset['description'] | MelodiDataset['title']) => {
  if (!array || !Array.isArray(array) || array.length === 0) return ''
  const found = array.find(item => item.lang === 'fr' || item.lang === 'FR')
  return found ? found.content : ''
}

export const extractZipAndSelect = async (zipPath: string, destDir: string): Promise<string> => {
  const zip = new AdmZip(zipPath)
  const entries = zip.getEntries()

  let bestEntry = null
  let maxSize = 0

  for (const entry of entries) {
    if (entry.header.size > maxSize) {
      maxSize = entry.header.size
      bestEntry = entry
    }
  }

  if (!bestEntry) {
    throw new Error('No entries found in the ZIP file')
  }

  zip.extractEntryTo(bestEntry, destDir, false, true)

  return path.join(destDir, bestEntry.name)
}