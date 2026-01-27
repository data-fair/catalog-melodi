import type { PrepareContext } from '@data-fair/types-catalogs'
import type { MelodiCapabilities } from './capabilities.ts'
import type { MelodiConfig } from '#types'
import axios from '@data-fair/lib-node/axios.js'

export default async ({ catalogConfig }: PrepareContext<MelodiConfig, MelodiCapabilities>) => {
  if (!catalogConfig.consumerID || !catalogConfig.consumerSecret) {
    try {
      await axios.get('https://api.insee.fr/melodi/catalog/all')
    } catch (error) {
      console.error('Error connecting to Melodi API at https://api.insee.fr/melodi:', error)
      throw new Error('Unable to connect to Melodi API at https://api.insee.fr/melodi. Please check the URL and your network connection.')
    }
    return {
      catalogConfig
    }
  }

  return {
    catalogConfig
  }
}
