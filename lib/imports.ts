import type { MelodiConfig, MelodiDataset, MelodiRange } from '#types'
import axios from '@data-fair/lib-node/axios.js'
import type { CatalogPlugin, GetResourceContext, Resource } from '@data-fair/types-catalogs'
import { getLanguageContent, extractCsv, extractCsvWithFilters, downloadFileWithProgress, buildImportParams } from './utils.ts'
import path from 'path'

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
 * Counts the number of items in a Melodi dataset
 * @returns a boolean indicating whether the dataset as enough items for a single call to fetch all items.
 */
const countPagging = async (resourceId: string): Promise<boolean> => {
  try {
    const response = await axios.get(`https://api.insee.fr/melodi/data/${resourceId}`, {
      params: {
        maxResult: 0,
        totalCount: true
      }
    })
    const totalItems = response.data?.paging?.count
    if (typeof totalItems === 'number' && totalItems > 0 && totalItems < 100000) {
      return true
    }
    return false
  } catch (e) {
    // In case of error, we return false and log the error
    console.error(`Erreur lors de la vérification de pagination pour ${resourceId}`, e)
    return false
  }
}

/**
 * Downloads the resource via ZIP (for large datasets), extracts the relevant file,
 * and applies filters locally if necessary.
 * @param context - The execution context (config, dirs, logs).
 * @param url - The direct download URL for the ZIP file.
 * @returns The path to the final CSV file.
 */
const downloadResourceZip = async ({ importConfig, resourceId, tmpDir, log }: GetResourceContext<MelodiConfig>, url: string): Promise<string> => {
  const destFile = path.join(tmpDir, `${resourceId}.zip`)
  try {
    // 1. Download the ZIP file with a progress bar
    const result = await downloadFileWithProgress(url, destFile, resourceId, log)
    let finalResult: string
    // 2. Check if filters are configured
    if (importConfig.filters && Array.isArray(importConfig.filters) && importConfig.filters.length > 0) {
      // Transform config filters into a clean dictionary (Record<string, string[]>)
      const importParams = buildImportParams(importConfig.filters)
      // Extract and filter lines
      finalResult = await extractCsvWithFilters(result, importParams, tmpDir, resourceId, log)
    } else {
      // Standard extraction without filtering
      finalResult = await extractCsv(result, tmpDir, resourceId)
    }
    return finalResult
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error downloading Melodi ZIP dataset:', error)
    await log.error('Error downloading Melodi ZIP dataset', errorMessage)
    throw new Error('Failed to download Melodi dataset (ZIP)')
  }
}

/**
 * Downloads the resource via the Melodi API (for small datasets).
 * Filters are applied directly via API query parameters.
 * @param context - The execution context.
 * @returns The path to the downloaded CSV file.
 */
const downloadResourceCsv = async ({ importConfig, resourceId, tmpDir, log }: GetResourceContext<MelodiConfig>): Promise<string> => {
  const destFile = path.join(tmpDir, `${resourceId}.csv`)
  try {
    let axiosConfig = {}
    // Prepare API parameters based on filters
    if (importConfig.filters && Array.isArray(importConfig.filters) && importConfig.filters.length > 0) {
      const importParams = buildImportParams(importConfig.filters)
      axiosConfig = {
        params: {
          ...importParams,
          maxResult: 1000000 // Request a large page size to get everything
        },
        // Custom serializer to handle array parameters correctly for Java/Spring backends
        // Converts { code: ['A', 'B'] } to "code=A&code=B" instead of "code[]=A&code[]=B"
        paramsSerializer: (params: any) => {
          const paramStrings: string[] = []
          for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined) continue
            if (Array.isArray(value)) {
              for (const val of value) {
                paramStrings.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`)
              }
            } else {
              paramStrings.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            }
          }
          return paramStrings.join('&')
        }
      }
    } else {
      // No filters: just ask for the max results
      axiosConfig = { params: { maxResult: 1000000 } }
    }
    // Perform the download
    const finalResult = downloadFileWithProgress(`https://api.insee.fr/melodi/data/${resourceId}`, destFile, resourceId, log, axiosConfig)
    return finalResult
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error downloading Melodi CSV API:', error)
    await log.error('Error downloading Melodi CSV API', errorMessage)
    throw new Error('Failed to download Melodi dataset (API CSV)')
  }
}

/**
 * Main entry point to retrieve a resource.
 * Decides whether to use the API (CSV) or the File (ZIP) based on dataset size.
 * @param context - The context containing the resource identifier, temporary directory, and logger.
 * @returns The dataset object with the local filePath updated.
 */
export const getResource = async (context: GetResourceContext<MelodiConfig>): ReturnType<CatalogPlugin['getResource']> => {
  await context.log.step('Téléchargement du fichier')
  const dataset = await getMetaData(context)
  if (!dataset.origin) {
    throw new Error(`Le dataset ${dataset.id} ne possède pas de fichier associé.`)
  }
  const isSmallDataset = await countPagging(context.resourceId)
  if (isSmallDataset) {
    context.log.info(`Dataset léger détecté (${context.resourceId}), téléchargement CSV direct.`)
    dataset.filePath = await downloadResourceCsv(context)
  } else {
    context.log.info(`Dataset volumineux détecté (${context.resourceId}), téléchargement ZIP.`)
    dataset.filePath = await downloadResourceZip(context, dataset.origin)
  }
  return dataset
}
