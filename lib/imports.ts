import type { MelodiConfig, MelodiDataset,MelodiRange  } from '#types'
import axios from '@data-fair/lib-node/axios.js'
import type { CatalogPlugin, GetResourceContext, Resource } from '@data-fair/types-catalogs'
import { extractZipAndSelect, getLanguageContent } from './utils.ts'
import path from 'path'
import fs from 'fs'

const getMetaData = async ({ catalogConfig, importConfig, resourceId, log }: GetResourceContext<MelodiConfig>): Promise<Resource> => {
  let melodiDataset: MelodiDataset
  let melodiRange: MelodiRange
  try{
    melodiDataset = (await axios.get(`${catalogConfig.apiUrl}/catalog/${resourceId}`)).data
    melodiRange = (await axios.get(`${catalogConfig.apiUrl}/range/${resourceId}`)).data
  }
  catch (e) {
    console.error(`Error fetching datasets from Melodi ${e}`)
    await log.error(`Erreur pendant la récuperation des données depuis Melodi ${e instanceof Error ? e.message : String(e)}`)
    throw new Error('Erreur lors de la récuperation de la resource Melodi')
  }
  const firstFile = melodiDataset.product && melodiDataset.product.length > 0 
    ? melodiDataset.product[0] 
    : null
  const melodiRangeTable = melodiRange.range

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
      return {
        key: field.concept.code.toLowerCase(),
        title: field.concept.label?.fr || field.concept.label?.en || field.concept.code,
        type: 'string',
        "x-labels": Object.keys(labels).length > 0 ? labels : undefined
      }
    })
  }

  return {
    id: melodiDataset.identifier,
    title: getLanguageContent(melodiDataset.title) ?? melodiDataset.identifier,
    description: getLanguageContent(melodiDataset.description) ?? '',
    updatedAt: melodiDataset.modified,
    size: firstFile?.byteSize ?? 0,
    format: firstFile?.packageFormat ? 'csv' : 'unknown',
    origin: firstFile?.accessURL ?? '',
    filePath: '',
    schema: generatedSchema
  } as Resource
}

/**
 * Downloads the rows of a dataset matching the given filters and saves them as a `.csv.gz` file in a temporary directory.
 *
 * @param catalogConfig - The ODS configuration object.
 * @param resourceId - The ID of the dataset to download.
 * @param importConfig - The import configuration, including filters to apply.
 * @param tmpDir - The path to the temporary directory where the CSV will be saved.
 * @param log - The logger to record progress and errors.
 * @returns A promise resolving to the file path of the downloaded dataset.
 * @throws If there is an error writing the file or fetching the dataset.
 */
const downloadResource = async ({ catalogConfig, resourceId, importConfig, tmpDir, log }: GetResourceContext<MelodiConfig>, url: string): Promise<string> => {
  // remove empty contraints
  const destFile = path.join(tmpDir, `${resourceId}.zip`)
  const writer = fs.createWriteStream(destFile)

  try {
    const response = await axios.get(url, {
      responseType: 'stream',
    })
    

    let downloadedBytes = 0
    await log.task(`download ${resourceId}`, `File size: `, NaN)

    const logInterval = 500
    let lastLogged = Date.now()

    response.data.on('data', (chunk: any) => {
      downloadedBytes += chunk.length
      const now = Date.now()
      if (now - lastLogged > logInterval) {
        lastLogged = now
        log.progress(`download ${resourceId}`, downloadedBytes)
      }
    })

    response.data.pipe(writer)

    const result = await new Promise<string>((resolve, reject) => {
      writer.on('finish', () => resolve(destFile))
      writer.on('error', (err: any) => {
        fs.unlink(destFile, () => { })
        reject(err)
      })

      response.data.on('error', (err: any) => {
        fs.unlink(destFile, () => { })
        reject(err)
      })
    })

    const stats = fs.statSync(destFile)
    await log.progress(`download ${resourceId}`, stats.size, stats.size)

    const finalResult = await extractZipAndSelect(result, tmpDir)
    fs.unlinkSync(destFile)

    return finalResult
  } catch (error) {
    console.error('Erreur lors de la récupération du dataset ODS (stream)', error)
    await log.error('Erreur lors de la récupération du dataset ODS (stream)', error instanceof Error ? error.message : String(error))
    throw new Error('Erreur pendant le téléchargement du dataset ODS en streaming')
  }
}

/**
 * Downloads the dataset and its attachments, retrieves its metadata and returns the dataset metadata with the downloaded file path included.
 * @param context The context containing the catalog configuration and resource identifier.
 * @returns A promise that resolves to the dataset metadata with the downloaded file path included.
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
