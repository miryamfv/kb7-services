/**
 * Copyright (c) Kernel
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict'

import crypto from 'crypto'
import merge from 'deepmerge'
import { Worker } from 'snowflake-uuid'

// TODO: move to common
const BASE = 'resources'
const DELIMITER = '/'

const ROLE_ALL = 1000
const ROLE_OWNER = 2000
const ROLE_CORE = 100

const AccessDeniedError = ({ iss, policy }) => {
  throw { name: 'AccessDenied', message: `Not able to take this action: ${iss}, ${JSON.stringify(policy)}`   }
}

const build = async (client, resourceService, { base = BASE } = {}) => {

  // load known resources
  await resourceService.setup()
  const resources = await resourceService.resources()

  //TODO: worker opts
  const generator = new Worker()
  const uuid = () => generator.nextId().toString()
  const now = () => Date.now()

  const entityUri = (uri, id) => `${base}${DELIMITER}${uri}${DELIMITER}${id}`
  const entityFile = (uri) => `${uri}.json`
  const entityObject = ({ id, owner, created, updated, kind, uri, data  }) => {
    return { id, owner, created, updated, kind, uri, data }
  }

  const create = async ({ iss, role }, { resource }, data,
    { owner = iss, id = uuid(), created = now(), updated = now() }) => {
      const { uri, policy } = resources[resource]
      if (role >= policy.create) {
        AccessDeniedError({ iss, policy })
      }

      const entity = entityObject({
        id, owner, created, updated, kind: resource, uri: entityUri(uri, id), data
      })
      return client.save(entityFile(entity.uri), entity)
  }


  const get = async ({ iss, role }, { resource }, id) => {
    const { uri, policy } = resources[resource]
    const entity = await client.download(entityFile(entityUri(uri, id)))
    if (role >= policy.get && entity.owner != iss) {
      AccessDeniedError({ iss, policy })
    }
    return entity
  }

  //TODO: add pagination support
  const list = async ({ iss, role }, { resource }) => {
    const { uri, policy } = resources[resource]
    if (role >= policy.list) {
      AccessDeniedError({ iss, policy })
    }
    const entities = await client.listObjects({
      query: {prefix: `${base}${DELIMITER}${uri}${DELIMITER}`}
    })
    return entities.map((e) => e.split(DELIMITER).slice(-1)[0])
  }

  //TODO: add pagination support
  const getAll = async ({ iss, role }, { resource }) => {
    const { uri, policy } = resources[resource]
    if (role >= policy.getAll) {
      AccessDeniedError({ iss, policy })
    }
    return await client.getObjects({
      query: {prefix: `${base}${DELIMITER}${uri}${DELIMITER}`},
      reducer: (acc, e) => {
        acc[e.id] = e
        return acc
      }
    })
  }

  const remove = async ({ iss, role }, { resource }, id) => {
    const { uri, policy } = resources[resource]
    if (role >= policy.remove) {
      AccessDeniedError({ iss, policy })
    }
    await client.remove(entityFile(entityUri(uri, id)))
    return { resource, uri, id }
  }

  const exists = async ({ iss, role }, { resource }, id) => {
    const { uri, policy } = resources[resource]
    if (role >= policy.exists) {
      AccessDeniedError(`${iss} cannot read ${resource}`)
    }
    return client.exists(entityFile(entityUri(uri, id)))
  }

  const patch = async ({ iss, role }, { resource }, id, data) => {
    const { uri, policy } = resources[resource]
    const entity = await get({ iss, role }, { resource }, id)
    if (role >= policy.update && entity.owner != iss) {
      AccessDeniedError({ iss, policy })
    }
    Object.assign(entity.data, merge(entity.data, data))
    entity.updated = now()
    return client.save(entityFile(entity.uri), entity)
  }

  const update = async ({ iss, role }, { resource }, id, data) => {
    const { uri, policy } = resources[resource]
    const entity = await get({ iss, role }, { resource }, id)
    if (role >= policy.update && entity.owner != iss) {
      AccessDeniedError({ iss, policy })
    }
    Object.assign(entity, { data })
    entity.updated = now()
    return client.save(entityFile(entity.uri), entity)
  }

  const updateMeta = async ({ iss, role }, { resource }, id, { owner }) => {
    const { uri, policy } = resources[resource]
    const entity = await get({ iss, role }, { resource }, id)
    if (role >= policy.updateMeta && entity.owner != iss) {
      AccessDeniedError({ iss, policy })
    }
    Object.assign(entity, merge(entity, { owner }))
    return client.save(entityFile(entity.uri), entity)
  }

  return {
    uuid, list, create, get, getAll, patch, update, updateMeta, remove, exists
  }
}

const entity = {
  build
}

export default entity
