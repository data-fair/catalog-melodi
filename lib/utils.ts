import type { MelodiDataset } from '#types'
import path from 'path'
import StreamZip from 'node-stream-zip'
import fs from 'fs'
import readline from 'readline'

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
 * Function to extract the largest CSV file from a ZIP archive and save it to a specified directory.
 * @param zipPath used to find the zip file to process
 * @param destDir used to save the output file
 * @param resourceId used to name the output file
 * @returns a promise that resolves to the path of the extracted CSV file
 */
export const extractCsv = async (
  zipPath: string,
  destDir: string,
  resourceId: string
): Promise<string> => {
  const StreamZipAsync = StreamZip.async
  const zip = new StreamZipAsync({ file: zipPath }) // Use async version

  try {
    const entries = await zip.entries()
    const entriesList = Object.values(entries)

    if (entriesList.length === 0) {
      throw new Error('file is empty')
    }

    let largestEntry = entriesList[0]
    for (const entry of entriesList) {
      if (entry.size > largestEntry.size) {
        largestEntry = entry
      }
    }

    const outputFileName = `${resourceId}.csv`
    const outputPath = path.join(destDir, outputFileName)

    await zip.extract(largestEntry.name, outputPath) // Extract the largest file

    return outputPath
  } catch (err) {
    throw new Error(`Error while extracting CSV : ${err}`)
  } finally {
    await zip.close()
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath)
    }
  }
}

/**
 * Extracts a CSV file from a zip archive and saves it to the specified destination directory.
 * @param zipFilePath - The path to the zip archive.
 * @param filters - An object containing filter criteria for the CSV file.
 * @param destDir - The destination directory where the CSV file will be saved.
 * @param resourceId - The resource ID used to generate the output file name.
 * @param log - The logger object used to log messages.
 */
export async function extractCsvWithFilters (
  zipFilePath: string,
  filters: Record<string, string[]>,
  destDir: string,
  resourceId: string,
  log: any
): Promise<string> {
  const StreamZipAsync = StreamZip.async
  const zip = new StreamZipAsync({ file: zipFilePath })
  try {
    const entries = await zip.entries()
    const entriesList = Object.values(entries)

    if (entriesList.length === 0) {
      throw new Error('file is empty')
    }

    let largestEntry = entriesList[0]
    for (const entry of entriesList) {
      if (entry.size > largestEntry.size) {
        largestEntry = entry
      }
    }

    // Prepare filter sets: clean values and convert to Set for efficient lookup
    const filterSets: Record<string, Set<string>> = {}
    for (const key in filters) {
      filterSets[key] = new Set(filters[key].map(v => v.trim().replace(/"/g, '')))
    }

    const outputFileName = `${resourceId}.csv`
    const outputPath = path.join(destDir, outputFileName)
    const output = fs.createWriteStream(outputPath)

    const zipStream = await zip.stream(largestEntry.name)
    const rl = readline.createInterface({
      input: zipStream, // Create an interface to read the stream line by line
      crlfDelay: Infinity // Recognize all instances of CR LF as a single line break
    })
    const NUMERIC_COLUMNS = new Set(['TIME_PERIOD', 'OBS_VALUE']) // Define columns that must be treated as numbers

    const numericIndices: Set<number> = new Set()
    const filterIndices: Record<string, number> = {}
    let isHeader = true

    for await (const line of rl) {
      if (!line.trim()) continue // skip empty lines
      const columns = line.split(';')

      if (isHeader) {
        const newHeaders = []
        for (let i = 0; i < columns.length; i++) {
          const cleanName = columns[i].trim().replace(/"/g, '') // Clean the column name: remove whitespace and quotes

          // Map the index if this column is used for filtering
          if (filterSets[cleanName]) {
            filterIndices[cleanName] = i
          }

          if (NUMERIC_COLUMNS.has(cleanName)) {
            numericIndices.add(i) // // Store index for later numeric formatting
            newHeaders.push(cleanName) // TIME_PERIOD
          } else {
            newHeaders.push(`"${cleanName}"`) // "GEO"
          }
        }
        output.write(newHeaders.join(';') + '\n')
        isHeader = false
        continue
      }

      let keepLine = true // default: keep the line

      for (const dim in filterIndices) { // for every dimension, check if the value matches the filter set
        const val = columns[filterIndices[dim]]?.trim().replace(/"/g, '') || '' // clean the value and check if it matches the filter set
        if (!filterSets[dim].has(val)) {
          keepLine = false
          break
        }
      }

      // If the line is to be kept, process and write it
      if (keepLine) {
        const newRow = columns.map((col, index) => {
          const val = col.trim().replace(/"/g, '') // raw data

          if (val === '') return '' // -> ;;

          if (numericIndices.has(index)) return val // -> 2021

          return `"${val}"` // -> "FR"
        })

        output.write(newRow.join(';') + '\n') // -> 2021;"FR"
      }
    }

    output.end()

    await new Promise<void>((resolve) => {
      output.on('finish', () => resolve())
    })

    return outputPath
  } catch (err: any) {
    await log.error(`Erreur processCsvInZip : ${err.message}`)
    throw err
  } finally {
    await zip.close()
    if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath)
  }
}
