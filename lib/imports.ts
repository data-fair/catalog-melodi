import type { MelodiConfig, MelodiDataset, MelodiRange } from '#types'
import axios from '@data-fair/lib-node/axios.js'
import type { CatalogPlugin, GetResourceContext, Resource } from '@data-fair/types-catalogs'
import { getLanguageContent, buildImportParams, serializeParams } from './utils/common.ts'
import { downloadFileWithProgress } from './utils/download.ts'
import { extractCsvWithFilters, pivotCsv } from './utils/csv.ts'
import path from 'path'

/**
 * Fetches metadata for a specific Melodi dataset and transforms it into a Data-Fair Resource.
 * @param catalogConfig The Melodi catalog configuration.
 * @param importConfig The import configuration.
 * @param resourceId The identifier of the Melodi dataset to fetch.
 * @param log The logger for logging progress and errors.
 * @returns A promise that resolves to the Resource metadata.
 */
const getMetaData = async ({ importConfig, resourceId, log }: GetResourceContext<MelodiConfig>): Promise<Resource> => {
  let melodiDataset: MelodiDataset // range information for schema generation
  try {
    melodiDataset = (await axios.get(`https://api.insee.fr/melodi/catalog/${resourceId}`)).data
  } catch (e) {
    await log.error(`Erreur lors de la récupération du dataset Melodi ${e instanceof Error ? e.message : String(e)}`)
    throw new Error('Error fetching Melodi dataset metadata')
  }
  // Prepare Resource metadata, first file is used for size/format/origin of the uploaded csv
  const firstFile = melodiDataset.product && melodiDataset.product.length > 0 ? melodiDataset.product[0] : null
  let ressourceTitle : string
  // Determine resource title based on importConfig
  if (importConfig.useDatasetTitle) {
    ressourceTitle = getLanguageContent(melodiDataset.title) ?? melodiDataset.identifier
  } else {
    ressourceTitle = melodiDataset.identifier ?? getLanguageContent(melodiDataset.title)
  }
  // Generate schema from melodiRangeTable, it will be injected in the Resource object for Data-Fair to use it

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
  } as Resource
}

/**
 * Counts the number of items in a Melodi dataset
 * @returns a boolean indicating whether the dataset as enough items for a single call to fetch all items.
 */
const countPagging = async (resourceId: string, filters?: any[]): Promise<number> => {
  try {
    // Base parameters for counting
    let requestParams: any = {
      maxResult: 0,
      totalCount: true
    }
    // Inject filters if present
    if (filters && Array.isArray(filters) && filters.length > 0) {
      const filterParams = buildImportParams(filters)
      requestParams = { ...requestParams, ...filterParams }
    }
    const response = await axios.get(`https://api.insee.fr/melodi/data/${resourceId}`, {
      params: requestParams,
      paramsSerializer: serializeParams
    })
    const totalItems = response.data?.paging?.count
    return totalItems || 0
  } catch (e) {
    // In case of error, we return false and log the error
    console.error(`Erreur lors de la vérification de pagination pour ${resourceId}`, e)
    return 0
  }
}

/**
 * Downloads the resource via ZIP (for large datasets), extracts the relevant file,
 * and applies filters locally.
 * @param context - The execution context (config, dirs, logs).
 * @param url - The direct download URL for the ZIP file.
 * @returns The path to the final CSV file.
 */
const downloadResourceZip = async ({ importConfig, resourceId, tmpDir, log }: GetResourceContext<MelodiConfig>, url: string): Promise<string> => {
  const destFile = path.join(tmpDir, `${resourceId}.zip`)
  try {
    // Download the ZIP file with a progress bar
    const result = await downloadFileWithProgress(url, destFile, resourceId, log)
    // Transform config filters into a clean dictionary (Record<string, string[]>)
    const importParams = buildImportParams(importConfig.filters)
    // Extract and filter lines from the ZIP
    return await extractCsvWithFilters(result, importParams, tmpDir, resourceId, log)
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
    // Prepare API parameters based on filters
    const importParams = buildImportParams(importConfig.filters)
    const axiosConfig = {
      params: {
        ...importParams,
        maxResult: 1000000 // Request a large page size to get everything
      },
      paramsSerializer: serializeParams
    }
    // Perform the download
    const finalResult = downloadFileWithProgress(`https://api.insee.fr/melodi/data/${resourceId}/to-csv`, destFile, resourceId, log, axiosConfig)
    return finalResult
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error downloading Melodi CSV API:', error)
    await log.error('Error downloading Melodi CSV API', errorMessage)
    throw new Error('Failed to download Melodi dataset (API CSV)')
  }
}

/**
  * Retrieves the resource file for a specific Melodi dataset, applying filters and transformations as needed.
  * @param context The execution context containing configuration, resource ID, and logging.
  * @returns A promise that resolves to the Resource with the filePath set to the downloaded file.
 */
export const getResource = async (context: GetResourceContext<MelodiConfig>): ReturnType<CatalogPlugin['getResource']> => {
  await context.log.step('Téléchargement du fichier')
  const dataset = await getMetaData(context)
  if (!dataset.origin) {
    throw new Error(`Le dataset ${dataset.id} ne possède pas de fichier associé.`)
  }
  const baseFilters = context.importConfig.filters ? [...context.importConfig.filters] : []
  const activeFilters = [...baseFilters]
  if (context.importConfig.geoLevel) {
    activeFilters.push({
      selectedConcept: 'GEO',
      selectedValues: [context.importConfig.geoLevel]
    })
  }
  const totalCount = await countPagging(context.resourceId, activeFilters)
  if (totalCount > 0 && totalCount <= 100000) {
    const contextWithFilters = {
      ...context,
      importConfig: {
        ...context.importConfig,
        filters: activeFilters
      }
    }
    context.log.info(`Dataset léger détecté (${context.resourceId}), téléchargement CSV direct.`)
    dataset.filePath = await downloadResourceCsv(contextWithFilters)
  } else {
    context.log.info(`Dataset volumineux détecté (${context.resourceId}), téléchargement ZIP.`)
    // For large datasets, download via ZIP
    const zipFilters = [...baseFilters]
    if (context.importConfig.geoLevel && context.importConfig.geoLevel !== 'NAT') {
      zipFilters.push({
        selectedConcept: 'GEO_OBJECT',
        selectedValues: [context.importConfig.geoLevel]
      })
    }
    const zipContext = {
      ...context,
      importConfig: { ...context.importConfig, filters: zipFilters }
    }
    dataset.filePath = await downloadResourceZip(zipContext, dataset.origin)
  }
  let melodiRangeTable : MelodiRange
  try {
    melodiRangeTable = (await axios.get(`https://api.insee.fr/melodi/range/${context.resourceId}`)).data.range
  } catch {
    throw new Error('Error fetching Melodi dataset metadata or range information')
  }
  if (context.importConfig.pivotConcepts && context.importConfig.pivotConcepts.length > 0) {
    try {
      await context.log.step('Transformation')
      const pivotedFilePath = await pivotCsv({
        sourceCsvPath: dataset.filePath,
        destDir: context.tmpDir,
        resourceId: context.resourceId,
        pivotConcepts: context.importConfig.pivotConcepts,
        rangeTable: melodiRangeTable,
        log: context.log,
        nbLines: totalCount
      })
      // replace filePath with the pivoted file
      dataset.filePath = pivotedFilePath.filePath
      dataset.schema = pivotedFilePath.schema
    } catch (error) {
      await context.log.error('Erreur lors du pivotage', error)
      throw error
    }
  } else {
    let generatedSchema: any[] = []
    if (melodiRangeTable && Array.isArray(melodiRangeTable)) {
      generatedSchema = melodiRangeTable.map((field: any) => {
        if (field.concept.code === 'GEO' || field.concept.code === 'GEO_OBJECT') {
          // Special handling for GEO fields
          return {
            key: field.concept.code.toLowerCase(),
            title: field.concept.label?.fr || field.concept.label?.en || field.concept.code,
            type: 'string',
            format: 'geo-code',
            'x-refersTo': 'http://www.w3.org/2004/02/skos/core#Concept'
          }
        }
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
    generatedSchema.push({
      key: 'OBS_VALUE',
      title: 'Valeur',
      type: 'number'
    })
    dataset.schema = generatedSchema
  }
  return dataset
}
