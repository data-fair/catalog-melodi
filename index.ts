import type CatalogPlugin from '@data-fair/types-catalogs'
import { importConfigSchema, configSchema, assertConfigValid, type MelodiConfig } from '#types'
import { type MelodiCapabilities, capabilities } from './lib/capabilities.ts'

const plugin: CatalogPlugin<MelodiConfig, MelodiCapabilities> = {
  async prepare (context) { return context },

  async list (context) {
    const { list } = await import('./lib/list.ts')
    return list(context)
  },

  async getResource (context) {
    const { getResource } = await import('./lib/imports.ts')
    return getResource(context)
  },

  metadata: {
    title: 'Melodi',
    thumbnailPath: './lib/resources/melodi_logo.png',
    i18n: {
      en: { description: 'Import datasets from the Melodi catalog (insee.fr).' },
      fr: { description: 'Importez des jeux de données depuis le catalogue Melodi (insee.fr).' }
    },
    capabilities
  },

  importConfigSchema,
  configSchema,
  assertConfigValid
}
export default plugin
