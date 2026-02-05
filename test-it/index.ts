import type CatalogPlugin from '@data-fair/types-catalogs'
import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach } from 'node:test'
import fs from 'fs-extra'
import { logFunctions } from './test-utils.ts'

// Import plugin and use default type like it's done in Catalogs
import plugin from '../index.ts'
const catalogPlugin: CatalogPlugin = plugin as CatalogPlugin

/** Melodi catalog configuration for testing purposes. */
const catalogConfig = {
  apiUrl: 'https://api.insee.fr/melodi',
  delay: 100, // 100ms delay for testing
}

const secrets = { secretField: 'Hey' }
const tmpDir = './data/test/downloads'

const getResourceParams = {
  catalogConfig,
  resourceId: 'DS_EC_DECES',
  secrets,
  importConfig: { useDatasetTitle: true },
  update: { metadata: true, schema: true },
  tmpDir,
  log: logFunctions
}

describe('catalog-Melodi', () => {
  it('should list resources and folder from root', async () => {
    const res = await catalogPlugin.list({
      catalogConfig,
      secrets,
      params: {}
    })

    assert.equal(res.count, 86, 'Expected 86 items in the root folder')
    assert.equal(res.results.length, 86)
  })

  it('should list resources and folder from a folder', { skip: 'This catalog does not support folders' }, async () => {})
  it('should list resources and folder with pagination', { skip: 'This catalog does not support pagination' }, async () => {})

  describe('should download a resource', async () => {
    // Ensure the temporary directory exists once for all tests
    before(async () => await fs.ensureDir(tmpDir))

    // Clear the temporary directory before each test
    beforeEach(async () => await fs.emptyDir(tmpDir))

    it('with correct params', async () => {
      const resourceId = 'DS_EC_DECES'
      const resource = await catalogPlugin.getResource({
        ...getResourceParams,
        resourceId
      })

      assert.ok(resource, 'The resource should exist')

      assert.equal(resource.id, resourceId, 'Resource ID should match')

      assert.ok(resource.filePath, 'Download URL should not be undefined')

      // Check if the file exists
      const fileExists = await fs.pathExists(resource.filePath)
      assert.ok(fileExists, 'The downloaded file should exist')
    })

    it('should fail for resource not found', async () => {
      const resourceId = 'non-existent-resource'

      await assert.rejects(
        async () => {
          await catalogPlugin.getResource({
            ...getResourceParams,
            resourceId
          })
        },
        /not found|does not exist|Error fetching Melodi|/i,
        'Should throw an error for non-existent resource'
      )
    })
  })
})
