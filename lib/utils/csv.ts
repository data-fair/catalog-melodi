import path from 'path'
import StreamZip from 'node-stream-zip'
import fs from 'fs'
import readline from 'readline'
import type { MelodiRange } from '#types'

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
          const cleanName = columns[i].replace(/"/g, '').trim() // Clean the column name: remove whitespace and quotes

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
        const idx = filterIndices[dim]
        const rawVal = columns[idx] || ''
        const val = rawVal.replace(/"/g, '').trim()
        if (!filterSets[dim].has(val)) {
          keepLine = false
          break
        }
      }

      // If the line is to be kept, process and write it
      if (keepLine) {
        const newRow = columns.map((col, index) => {
          const val = col.replace(/"/g, '').trim() // raw data

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

interface PivotCsvOptions {
  sourceCsvPath: string
  destDir: string
  resourceId: string
  pivotConcepts: string[]
  columnsToKeep: string[]
  rangeTable: MelodiRange
  log: any
  nbLines: number
}

/**
  * Transforms a flat CSV file into a pivoted format based on specified concepts.
  * @param options - The options for the pivot transformation, including source and destination paths, concepts to pivot, and logging.
  * @returns An object containing the file path of the generated CSV and its schema.
 */
export async function pivotCsv (
  options: PivotCsvOptions
): Promise<{ filePath: string, schema: any[] }> {
  const {
    sourceCsvPath,
    destDir,
    resourceId,
    pivotConcepts,
    columnsToKeep,
    rangeTable,
    log,
    nbLines
  } = options
  const outputFileName = `${resourceId}_export.csv`
  const outputPath = path.join(destDir, outputFileName)

  // { "SEXE": { "M": "Homme" }, "AGE": { "Y15": "15 ans" } }
  const labelsMap: Record<string, Record<string, string>> = {}
  // { "SEXE": "Sexe", "AGE": "Tranche d'âge" }
  const conceptsLabelsMap: Record<string, string> = {}
  if (rangeTable && Array.isArray(rangeTable)) {
    for (const dim of rangeTable) {
      const cCode = dim.concept.code
      conceptsLabelsMap[cCode] = dim.concept.label?.fr || dim.concept.label?.en || cCode
      labelsMap[cCode] = {}
      if (dim.values) {
        for (const v of dim.values) {
          labelsMap[cCode][v.code] = v.label?.fr || v.label?.en || v.code
        }
      }
    }
  }

  const COL_VAL = 'OBS_VALUE'

  // Map<"GeoCode|Year", { "Columns...": Value }>, ex: "FR|2021" => { "y15f": "123", ... }
  const buffer = new Map<string, Record<string, string>>()
  // Ex: "h15" -> "Homme - 15 ans"
  const dynamicHeadersMap = new Map<string, string>()

  let sourceHeaders: string[] = []
  const colIndices: Record<string, number> = {}

  let progressLines = 0
  let lastLogged = Date.now()
  const logInterval = 500 // Log progress every 500ms
  await log.task('Transformation des données', 'Transformation...', nbLines)
  try {
    // Read source file
    const fileStream = fs.createReadStream(sourceCsvPath)
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

    for await (const line of rl) {
      const now = Date.now()
      progressLines++
      if (now - lastLogged > logInterval) {
        lastLogged = now
        log.progress('Transformation des données', progressLines, nbLines)
      }
      if (!line.trim()) continue
      // Clean up potential quotes
      const cols = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''))
      // Process first line
      if (sourceHeaders.length === 0) {
        sourceHeaders = cols
        cols.forEach((h, i) => { colIndices[h] = i }) // map column name -> index

        // Security check
        if (colIndices[COL_VAL] === undefined) {
          throw new Error('Colonne OBS_VALUE manquante')
        }
        continue
      }

      // Retrieve fixed data
      const obsVal = cols[colIndices[COL_VAL]]

      const rowKeyParts: string[] = []
      const keptValues: Record<string, string> = {}

      for (const colKeep of columnsToKeep) {
        const idx = colIndices[colKeep]
        if (idx !== undefined) {
          const val = cols[idx]
          rowKeyParts.push(val)
          keptValues[colKeep] = val // store fixed value for this column (ex: "GEO": "01", "TIME_PERIOD": "2021")
        } else {
          rowKeyParts.push('')
        }
      }
      const rowKey = rowKeyParts.join('|') // ex: "FR|2021"

      // sort pivot concepts to ensure a consistent column order, with Age/Sexe at the end
      const sortedConcepts = [...pivotConcepts].sort((a, b) => {
        const isEnd = (key: string) => {
          const k = key.toLowerCase()
          return k.includes('age') || k.includes('sex') || k.includes('sexe')
        }
        // if A is Age/Sexe and not B, A goes to the end (1)
        if (isEnd(a) && !isEnd(b)) return 1
        // if B is Age/Sexe and not A, B goes to the end (-1)
        if (!isEnd(a) && isEnd(b)) return -1
        // otherwise keep original order (0)
        return 0
      })

      // Build dynamic column name
      const pivotParts: string[] = []
      const titleParts: string[] = []

      for (const pc of sortedConcepts) {
        const idx = colIndices[pc]
        if (idx !== undefined) {
          const val = cols[idx]

          const cleanVal = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '') // clean value: lowercase, no accents, alphanumeric only
          pivotParts.push(`${cleanVal}`)

          const humanLabel = labelsMap[pc]?.[val] || val // get human-readable label if available
          titleParts.push(humanLabel)
        }
      }

      // If no pivot concept found, call the column "value"
      const finalColName = pivotParts.length > 0 ? pivotParts.join('') : 'value'
      const finalColTitle = titleParts.length > 0 ? titleParts.join(' - ') : 'Valeur' // Human-readable column title for the schema

      // Initialize the row in buffer if not already there
      if (!buffer.has(rowKey)) {
        buffer.set(rowKey, {
          ...keptValues // { GEO: "01004", TIME_PERIOD: "2021" }
        })
      }

      // Add observed value to the correct column
      const rowObj = buffer.get(rowKey)! // non-null assertion as we just set it if missing, get the existing object

      const previousValue = parseFloat((rowObj[finalColName] || '0').replace(',', '.'))
      const newValue = parseFloat((obsVal || '0').replace(',', '.'))
      const total = previousValue + newValue
      rowObj[finalColName] = total.toString() // set the observed value next to all other columns

      // Note that this column exists
      if (!dynamicHeadersMap.has(finalColName)) {
        dynamicHeadersMap.set(finalColName, finalColTitle)
      }
    }

    // Write final file
    const output = fs.createWriteStream(outputPath)

    // Define final headers
    const keptHeadersOutput = columnsToKeep.map(c => c.toLowerCase())

    // Sort dynamic columns alphabetically for cleanliness
    const sortedDynHeaders = Array.from(dynamicHeadersMap.keys()).sort()

    // Write header line
    output.write([...keptHeadersOutput, ...sortedDynHeaders].join(';') + '\n')

    // Write data line by line
    for (const rowData of buffer.values()) {
      const row: string[] = []
      for (const colOriginalName of columnsToKeep) {
        let val = rowData[colOriginalName] || ''
        if (colOriginalName === 'GEO' || colOriginalName === 'CODE_INSEE') {
          val = `"${val}"`
        }
        row.push(val)
      }
      // Dynamic values
      for (const header of sortedDynHeaders) {
        // If value exists put it, otherwise '0'
        row.push(rowData[header] || '0')
      }
      output.write(row.join(';') + '\n')
    }

    log.progress('Transformation des données', nbLines, nbLines)
    output.end()
    // Wait for physical write to finish
    await new Promise<void>((resolve, reject) => {
      output.on('finish', resolve)
      output.on('error', reject)
    })
    // Generate schema based on the dynamic columns we found + fixed columns
    const generatedSchema: any[] = []

    for (const colKeep of columnsToKeep) {
      const lowerKey = colKeep.toLowerCase()
      const colDef: any = {
        key: lowerKey,
        title: conceptsLabelsMap[colKeep] || colKeep,
        type: 'string'
      }

      if (colKeep === 'GEO') {
        colDef.title = 'Code Insee'
        colDef.format = 'geo-code'
      } else if (colKeep === 'TIME_PERIOD') {
        colDef.title = 'Période'
        colDef.format = 'date'
      }

      generatedSchema.push(colDef)
    }
    // Add dynamic columns to schema
    for (const header of sortedDynHeaders) {
      generatedSchema.push({
        key: header,
        title: dynamicHeadersMap.get(header) || header, // "Homme - 15 ans"
        type: 'number'
      })
    }

    return {
      filePath: outputPath,
      schema: generatedSchema
    }
  } finally {
    // Cleanup: Delete the source file
    if (fs.existsSync(sourceCsvPath)) {
      fs.unlinkSync(sourceCsvPath)
    }
  }
}
