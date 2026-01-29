import type { PrepareContext } from '@data-fair/types-catalogs'
import type { MelodiCapabilities } from './capabilities.ts'
import type { MelodiConfig } from '#types'

export default async ({ catalogConfig }: PrepareContext<MelodiConfig, MelodiCapabilities>) => {
  return { catalogConfig }
}
