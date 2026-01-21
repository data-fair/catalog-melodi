import type { MelodiConfig, MelodiDataset } from '#types'
import capabilities from './capabilities.ts'
import axios from '@data-fair/lib-node/axios.js'
import type { CatalogPlugin, ListContext } from '@data-fair/types-catalogs'

type ResourceList = Awaited<ReturnType<CatalogPlugin['list']>>['results']


const getLanguageContent = (array: MelodiDataset['description'] | MelodiDataset['title']) => {
  if (!array || !Array.isArray(array) || array.length === 0) return ''
  const found = array.find(item => item.lang === 'fr' || item.lang === 'FR')
  return found ? found.content : (array[0]?.content || '')
}
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
      dateModified: melodiDataset.modified,
      size: firstFile?.byteSize ?? 0,
      format: firstFile?.packageFormat ?? 'unknown',
      origin: firstFile?.accessURL ?? '',
      type: 'resource'
    } as ResourceList[number])
  }
  return catalog
}

/**
 * Returns the catalog [list of dataset] from Melodi API
 * @param config the Melodi configuration
 * @returns the list of Resources available on this catalog
 */
export const list = async (config: ListContext<MelodiConfig, typeof capabilities>): ReturnType<CatalogPlugin<MelodiConfig>['list']> => {

  let res: MelodiDataset[]
  try {
    res = (await axios.get(`${config.catalogConfig.apiUrl}/catalog/all`)).data
  } catch (e) {
    console.error(`Error fetching datasets from Melodi ${e}`)
    throw new Error('Erreur lors de la récupération de la resource Melodi')
  }

  if (!Array.isArray(res)) {
    throw new Error('Invalid response format from Melodi API: "results" is not an array but ' + typeof res)
  }
  let filteredList: MelodiDataset[] = []

  const total_count = res.length
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
    count: filteredList.length || total_count,
    results: catalog,
    path: []
  }
}
