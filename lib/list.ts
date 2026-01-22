import type { MelodiConfig, MelodiDataset } from '#types'
import capabilities from './capabilities.ts'
import axios from '@data-fair/lib-node/axios.js'
import type { CatalogPlugin, ListContext } from '@data-fair/types-catalogs'
import { getLanguageContent } from './utils.ts'
import memoize from 'memoizee'
import c from 'config'

type ResourceList = Awaited<ReturnType<CatalogPlugin['list']>>['results']

/**
 * Transform an Melodi catalog into a Data-Fair catalog
 * @param melodiDataset the dataset to transform
 * @returns an object containing the count of resources, the transformed resources, and an empty path array
 */
const prepareCatalog = (melodiCatalog: MelodiDataset[]): ResourceList => {
  const catalog: ResourceList = []

  for (const melodiDataset of melodiCatalog) {
    const firstFile = melodiDataset.product && melodiDataset.product.length > 0 
      ? melodiDataset.product[0] 
      : null
    catalog.push({
      id: melodiDataset.identifier,
      title: getLanguageContent(melodiDataset.title) ?? melodiDataset.identifier,
      description: getLanguageContent(melodiDataset.description) ?? '',
      updatedAt: melodiDataset.modified,
      size: firstFile?.byteSize ?? 0,
      format: firstFile?.packageFormat ? 'csv' : 'unknown',
      origin: firstFile?.accessURL ?? '',
      type: 'resource'
    } as ResourceList[number])
  }
  return catalog
}

const getAllDatasets = memoize(async (apiUrl:string | undefined): Promise<MelodiDataset[]> => {
  try {
    const response = await axios.get(`${apiUrl}/catalog/all`)
    return response.data as MelodiDataset[]
  } catch (e) {
    console.error(`Error fetching datasets from Melodi ${e}`)
    throw new Error('Erreur lors de la récuperation des datasets Melodi')
  }
}, {
  promise: true,
  maxAge: 10 * 60 * 1000,
  primitive: true
})


/**
 * Returns the catalog [list of dataset] from Melodi API
 * @param config the Melodi configuration
 * @returns the list of Resources available on this catalog
 */
export const list = async (config: ListContext<MelodiConfig, typeof capabilities>): ReturnType<CatalogPlugin<MelodiConfig>['list']> => {
  let res: MelodiDataset[]
  res = await getAllDatasets(config.catalogConfig.apiUrl)
  const total_count = res.length

  let filteredList: MelodiDataset[] = []
  if (config.params?.q) {
    const searchTerm = config.params.q.toLowerCase().trim()
    filteredList = res.filter(dataset =>
      getLanguageContent(dataset.title)?.toLowerCase().includes(searchTerm) ||
      dataset.identifier?.toLowerCase().includes(searchTerm)
    )
    res = filteredList
  }
  if (config.params?.size || config.params?.page) {
    const page = Number(config.params?.page || 1)
    const size = Number(config.params?.size || 10)
    const start = (page - 1) * size
    const end = (start + size)
    res = res.slice(start, end)
  }

  const catalog = prepareCatalog(res)
  return {
    count: total_count,
    results: catalog,
    path: []
  }
}
