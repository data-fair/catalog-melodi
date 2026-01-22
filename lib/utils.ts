import type { MelodiDataset } from '#types'
import AdmZip from 'adm-zip'
import path from 'path'

/**
 * Retrieves content in the preferred language (French) from an array of multilingual objects.
 * @param array An array of objects containing 'lang' and 'content' properties.
 * @returns The content in the preferred language, or an empty string if not found.
 */
export const getLanguageContent = (array: MelodiDataset['description'] | MelodiDataset['title']) => {
  if (!array || !Array.isArray(array) || array.length === 0) return ''

  const found = array.find(item => item.lang === 'fr' || item.lang === 'FR')
  return found ? found.content : ''
}

/**
  * Extracts the largest file from a ZIP archive and saves it to the specified destination directory.
  * @param zipPath The path to the ZIP file.
  * @param destDir The directory where the extracted file will be saved.
  * @returns The path to the extracted file.
  */
export const extractZipAndSelect = async (zipPath: string, destDir: string): Promise<string> => {
  const zip = new AdmZip(zipPath) // Load the ZIP file
  const entries = zip.getEntries() // Get all entries in the ZIP

  let bestEntry = null
  let maxSize = 0

  // Find the entry with the largest size because Melodi ZIPs can contain multiple files, one with the data and a other with metadata
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
