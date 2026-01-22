import type CatalogPlugin from '@data-fair/types-catalogs'
import { importConfigSchema, configSchema, assertConfigValid, type MelodiConfig } from '#types'
import { type MelodiCapabilities, capabilities } from './lib/capabilities.ts'
import i18n from './lib/i18n.ts'

const plugin: CatalogPlugin<MelodiConfig, MelodiCapabilities> = {
  async prepare (context) {
    const prepare = (await import('./lib/prepare.ts')).default
    return prepare(context)
  },

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
    description: 'Importez des jeux de données depuis un catalogue Melodi (insee.fr).',
    thumbnailPath: './lib/resources/melodi_logo.png',
    i18n,
    capabilities
  },

  importConfigSchema,
  configSchema,
  assertConfigValid
}
export default plugin
