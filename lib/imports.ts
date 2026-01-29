import type { MelodiConfig, MelodiDataset, MelodiRange } from '#types'
import axios from '@data-fair/lib-node/axios.js'
import type { CatalogPlugin, GetResourceContext, Resource } from '@data-fair/types-catalogs'
import { getLanguageContent, extractCsv, extractCsvWithFilters } from './utils.ts'
import path from 'path'
import fs from 'fs'

/**
 * Fetches metadata for a specific Melodi dataset and transforms it into a Data-Fair Resource.
 * @param catalogConfig The Melodi catalog configuration.
 * @param importConfig The import configuration.
 * @param resourceId The identifier of the Melodi dataset to fetch.
 * @param log The logger for logging progress and errors.
 * @returns A promise that resolves to the Resource metadata.
 */
const getMetaData = async ({ catalogConfig, importConfig, resourceId, log }: GetResourceContext<MelodiConfig>): Promise<Resource> => {
  let melodiDataset: MelodiDataset
  let melodiRange: MelodiRange // range information for schema generation

  try {
    melodiDataset = (await axios.get(`https://api.insee.fr/melodi/catalog/${resourceId}`)).data
    melodiRange = (await axios.get(`https://api.insee.fr/melodi/range/${resourceId}`)).data
  } catch (e) {
    await log.error(`Erreur lors de la récupération du dataset Melodi ${e instanceof Error ? e.message : String(e)}`)
    throw new Error('Error fetching Melodi dataset metadata or range information')
  }
  // Prepare Resource metadata, first file is used for size/format/origin of the uploaded csv
  const firstFile = melodiDataset.product && melodiDataset.product.length > 0 ? melodiDataset.product[0] : null

  const melodiRangeTable = melodiRange.range

  let ressourceTitle : string

  // Determine resource title based on importConfig
  if (importConfig.useDatasetTitle) {
    ressourceTitle = getLanguageContent(melodiDataset.title) ?? melodiDataset.identifier
  } else {
    ressourceTitle = melodiDataset.identifier ?? getLanguageContent(melodiDataset.title)
  }

  // Generate schema from melodiRangeTable, it will be injected in the Resource object for Data-Fair to use it
  let generatedSchema: any[] = []
  if (melodiRangeTable && Array.isArray(melodiRangeTable)) {
    generatedSchema = melodiRangeTable.map((field: any) => {
      // code -> label mapping
      const labels: Record<string, string> = {}
      if (field.values && Array.isArray(field.values)) {
        field.values.forEach((val: any) => {
          labels[val.code] = val.label?.fr || val.label?.en || val.code
        })
      }

      // x-labels replaces the abbreviations for the real data in ui : example R -> 'Rural'
      return {
        key: field.concept.code.toLowerCase(),
        title: field.concept.label?.fr || field.concept.label?.en || field.concept.code,
        type: 'string',
        'x-labels': Object.keys(labels).length > 0 ? labels : undefined
      }
    })
  }

  return {
    id: melodiDataset.identifier,
    title: ressourceTitle,
    description: getLanguageContent(melodiDataset.description),
    updatedAt: melodiDataset.modified,
    size: firstFile?.byteSize ?? 0,
    format: firstFile?.format ?? 'unknown',
    origin: firstFile?.accessURL ?? '',
    license: {
      title: 'Licence Ouverte / Open Licence 2.0',
      href: 'https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf'
    },
    filePath: '',
    schema: generatedSchema
  } as Resource
}

/**
  * Downloads the resource from the given URL, extracts the largest file from the ZIP, and returns the file path.
  * @param context The context containing the resource ID, import configuration, temporary directory, and logger.
  * @param url The URL to download the resource from.
  */
const downloadResource = async ({ importConfig, resourceId, tmpDir, log }: GetResourceContext<MelodiConfig>, url: string): Promise<string> => {
  const destFile = path.join(tmpDir, `${resourceId}.zip`)
  const writer = fs.createWriteStream(destFile) // open the file for writing

  try {
    // Download the file as a stream
    const response = await axios.get(url, {
      responseType: 'stream',
    })

    let downloadedBytes = 0
    await log.task(`download ${resourceId}`, 'File size: ', NaN)

    const logInterval = 500
    let lastLogged = Date.now()

    // Listen for data events and update the progress log
    response.data.on('data', (chunk: any) => {
      downloadedBytes += chunk.length
      const now = Date.now()
      if (now - lastLogged > logInterval) {
        lastLogged = now
        log.progress(`download ${resourceId}`, downloadedBytes)
      }
    })

    response.data.pipe(writer) // pluck the stream into the file

    const result = await new Promise<string>((resolve, reject) => {
      writer.on('finish', () => resolve(destFile))
      writer.on('error', (err: any) => { // handle errors during the writing process
        fs.unlink(destFile, () => { })
        reject(err)
      })

      // Handle errors during the download process
      response.data.on('error', (err: any) => {
        fs.unlink(destFile, () => { })
        reject(err)
      })
    })

    const stats = fs.statSync(destFile)
    await log.progress(`download ${resourceId}`, stats.size, stats.size)

    let finalResult: string

    if (importConfig.filters && Array.isArray(importConfig.filters) && importConfig.filters.length > 0) {
      const importParams: Record<string, string[]> = {}
      // Build import parameters based on filters in importConfig
      for (const filter of importConfig.filters) {
        const code = filter.selectedConcept
        const values = filter.selectedValues
        if (importParams[code]) {
          // merge and deduplicate values, set used to deduplicate (ex: code=R, values=['R','U'], then code=R, values=['U','C'] => final values = ['R','U','C'])
          importParams[code] = [...new Set([...importParams[code], ...values])]
        } else {
          importParams[code] = values
        }
      }

      finalResult = await extractCsvWithFilters(result, importParams, tmpDir, resourceId, log)
    } else {
      finalResult = await extractCsv(result, tmpDir, resourceId)
    }

    return finalResult
  } catch (error) {
    console.error('Erreur lors de la récupération du dataset Melodi', error)
    await log.error('Erreur lors de la récupération du dataset Melodi', error instanceof Error ? error.message : String(error))
    throw new Error('Erreur pendant le téléchargement du dataset Melodi')
  }
}

/**
  * Downloads the resource file and returns the local file path.
  * @param context The context containing the resource identifier, temporary directory, and logger.
  * @returns The local file path of the downloaded resource.
  */
export const getResource = async (context: GetResourceContext<MelodiConfig>): ReturnType<CatalogPlugin['getResource']> => {
  await context.log.step('Téléchargement du fichier')
  const dataset = await getMetaData(context)
  if (!dataset.origin) {
    throw new Error(`Le dataset ${dataset.id} ne possède pas de fichier associé.`)
  }
  dataset.filePath = await downloadResource(context, dataset.origin)
  return dataset
}
