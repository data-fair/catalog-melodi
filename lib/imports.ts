import type { MelodiConfig, MelodiDataset, MelodiRange } from '#types'
import axios from '@data-fair/lib-node/axios.js'
import type { CatalogPlugin, GetResourceContext, Resource } from '@data-fair/types-catalogs'
import { getLanguageContent, extractZipAndSelect, streamToFile } from './utils.ts'
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
    await log.error(`Error from Melodi ${e instanceof Error ? e.message : String(e)}`)
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
    ressourceTitle = firstFile?.title ?? getLanguageContent(melodiDataset.title) ?? melodiDataset.identifier
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
    title: getLanguageContent(melodiDataset.title) ?? melodiDataset.identifier,
    description: ressourceTitle,
    updatedAt: melodiDataset.modified,
    size: firstFile?.byteSize ?? 0,
    format: firstFile?.packageFormat ? 'csv' : 'unknown',
    origin: firstFile?.accessURL ?? '',
    filePath: '',
    schema: generatedSchema
  } as Resource
}

/**
  * Two possible implementations depending on importConfig:
  1. Direct download of the CSV file from Melodi API
  2. Download of a ZIP file
  * @param context The context containing the resource identifier, temporary directory, import configuration, and logger.
  * @param url The URL to download the resource from.
  */
const downloadResource = async ({ importConfig, resourceId, tmpDir, log }: GetResourceContext<MelodiConfig>, url: string): Promise<string> => {
  try {
    // CASE 1: Filters are present -> CSV Download via API
    if (importConfig.filters && Array.isArray(importConfig.filters) && importConfig.filters.length > 0) {
      const destFile = path.join(tmpDir, `${resourceId}.csv`)
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

      // Specific Axios config for Melodi API (Params + Serializer)
      const axiosConfig = {
        params: {
          ...importParams,
          maxResult: 1000000 // To avoid default limit of 10000 rows
        },
        paramsSerializer: (params: any) => {
          const paramStrings = []
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

      return await streamToFile(`https://api.insee.fr/melodi/data/${resourceId}/to-csv`, destFile, axiosConfig, log)
    } else {
      // CASE 2: No filters -> Full ZIP Download
      const zipFile = path.join(tmpDir, `${resourceId}.zip`)

      // Call the helper function (no specific axios config needed)
      await streamToFile(url, zipFile, {}, log)

      // Extract and process the ZIP
      const finalResult = await extractZipAndSelect(zipFile, tmpDir)
      // Clean up the ZIP file after extraction
      fs.unlinkSync(zipFile)

      return finalResult
    }
  } catch (error: any) {
    console.error('Error retrieving Melodi dataset (stream)', error)
    await log.error('Error retrieving Melodi dataset (stream)', error instanceof Error ? error.message : String(error))
    throw new Error('Error during Melodi dataset streaming download')
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
