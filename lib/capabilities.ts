import type { Capability } from '@data-fair/types-catalogs'

export const capabilities = [
  'search',
  'pagination',

  'import',
  'importConfig',
] satisfies Capability[]

export type MelodiCapabilities = typeof capabilities
export default capabilities
