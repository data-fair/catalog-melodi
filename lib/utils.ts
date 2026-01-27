import type { MelodiDataset } from '#types'
import AdmZip from 'adm-zip'
import path from 'path'
import axios from '@data-fair/lib-node/axios.js'
import fs from 'fs'

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

export const streamToFile = async (url: string, destFile: string, axiosConfig: any, log: any): Promise<string> => {
  const writer = fs.createWriteStream(destFile) // Create a writable stream
  // Download the file as a stream
  const response = await axios.get(url, {
    ...axiosConfig,
    responseType: 'stream',
  })
  let downloadedBytes = 0
  await log.task(`download ${path.basename(destFile)}`, 'File size: ', NaN)
  const logInterval = 500
  let lastLogged = Date.now()
  // Track progress
  response.data.on('data', (chunk: any) => {
    downloadedBytes += chunk.length
    const now = Date.now()
    if (now - lastLogged > logInterval) {
      lastLogged = now
      log.progress(`download ${path.basename(destFile)}`, downloadedBytes)
    }
  })
  // Pipe the response data to the writable stream
  response.data.pipe(writer)
  await new Promise<void>((resolve, reject) => {
    writer.on('finish', () => resolve())
    // Handle errors
    const handleError = (err: any) => {
      fs.unlink(destFile, () => { }) // Clean up partial file
      reject(err)
    }
    writer.on('error', handleError) // Handle errors during writing
    response.data.on('error', handleError) // Handle errors during downloading
  })
  const stats = fs.statSync(destFile)
  await log.progress(`download ${path.basename(destFile)}`, stats.size, stats.size)
  return destFile
}
