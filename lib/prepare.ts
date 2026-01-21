import type { PrepareContext } from '@data-fair/types-catalogs'
import type { MelodiCapabilities } from './capabilities.ts'
import type { MelodiConfig } from '#types'
import axios from '@data-fair/lib-node/axios.js'

export default async ({ catalogConfig }: PrepareContext<MelodiConfig, MelodiCapabilities>) => {
  if (!catalogConfig.consumerID || !catalogConfig.consumerSecret) {
    try {
      await axios.get(`${catalogConfig.apiUrl}/catalog/all`)
    }
    catch (error) {
      console.error(`Error connecting to Melodi API at ${catalogConfig.apiUrl}:`, error)
      throw new Error(`Unable to connect to Melodi API at ${catalogConfig.apiUrl}. Please check the URL and your network connection.`)
    }
    return {
      catalogConfig
    }
  }

  const key = Buffer.from(`${catalogConfig.consumerID}:${catalogConfig.consumerSecret}`).toString('base64')
  try {
    await axios.post(`${catalogConfig.tokenUrl}`, 
      'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  } catch (error) {
    console.error(`Error obtaining OAuth2 token from Melodi API at ${catalogConfig.tokenUrl}:`, error)
    throw new Error(`Unable to obtain OAuth2 token from Melodi API at ${catalogConfig.tokenUrl}. Please check your consumerID and consumerSecret.`)
  }

  return {
    catalogConfig
  }
}

