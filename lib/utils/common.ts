import type { MelodiDataset, MelodiRange } from '#types'

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
 * transform filters from configuration into a deduplicated dictionary.
 * Merges values if the same concept appears multiple times.
 * @param filters - The array of filters from the configuration
 * @returns A record where keys are concept codes and values are unique selected values
 */
export function buildImportParams (filters: FilterConfig[]): Record<string, string[]> {
  const params: Record<string, string[]> = {}

  if (!filters || !Array.isArray(filters)) return params

  for (const filter of filters) {
    const code = filter.selectedConcept
    const values = filter.selectedValues

    // Skip invalid entries
    if (!code || !values || values.length === 0) continue

    if (params[code]) {
      // Merge existing values with new ones and remove duplicates using Set
      // Example: existing ['A', 'B'] + new ['B', 'C'] => Set {'A', 'B', 'C'}
      params[code] = [...new Set([...params[code], ...values])]
    } else {
      // Initialize with a copy of the values
      params[code] = [...values]
    }
  }

  return params
}

/**
 * Generates a standardized schema for the dataset based on the provided Melodi range table.
 * @param melodiRangeTable - The range table from Melodi metadata describing the dimensions and their values.
 * @returns An array representing the standardized schema for the dataset.
 */
export function generateStandardSchema (melodiRangeTable: MelodiRange): any[] {
  let schema: any[] = []

  if (melodiRangeTable && Array.isArray(melodiRangeTable)) {
    schema = melodiRangeTable.map((field: any) => {
      // Gestion spéciale GEO
      if (field.concept.code === 'GEO' || field.concept.code === 'GEO_OBJECT') {
        return {
          key: field.concept.code.toLowerCase(),
          title: field.concept.label?.fr || field.concept.label?.en || field.concept.code,
          type: 'string',
          format: 'geo-code'
        }
      }

      // Mapping des libellés (x-labels)
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
        'x-labels': Object.keys(labels).length > 0 ? labels : undefined
      }
    })
  }

  // Ajout de la colonne Valeur
  schema.push({
    key: 'obs_value',
    title: 'Valeur',
    type: 'number'
  })

  return schema
}

/** Serializes an object of parameters into a URL-encoded query string.
 * @param params - The parameters to serialize.
 * @returns A URL-encoded query string.
 */
export const serializeParams = (params: any): string => {
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

interface FilterConfig {
  selectedConcept: string
  selectedValues: string[]
}
