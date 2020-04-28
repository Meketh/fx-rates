import {MongoClient,MongoError} from 'mongodb'
import boom from '@hapi/boom'
import {config} from './config'

enum MongoErrorCodes {duplicateKey=11000}
const setId = <T extends Document>({_id, ...o}: T) => ({id:_id, ...o})
export const client = new MongoClient(config.dbUrl, {autoReconnect: true})
function getPairs() {
  return client.db().collection<Pair>('pairs')
}

export interface Document {
  _id: string
  id: string
}
export interface Fee {
  min: number
  max: number
  amount: number
  isFlat: boolean
}
export interface Pair extends Document {
  pair: [string, string]
  fees: Fee[] | {
    buy: Fee[]
    sell: Fee[]
  }
}

export const pairs = {
  async all() {
    const pairs = await getPairs().find().toArray()
    return pairs.map(setId)
  },
  async find(_id: string) {
    const pair = await getPairs().findOne({_id})
    if (!pair) {
      throw boom.notFound(`Pair not found: ${_id}`)
    }
    return setId(pair)
  },
  async insert(pair: Pair) {
    const pairs = getPairs()
    const [base, quote] = pair.pair
    if (base === quote) {
      throw boom.conflict(`Same base and quote currency: ${quote}`)
    }
    let _id = [quote, base].join('')
    const reversePair = await pairs.findOne({_id})
    if (reversePair) {
      throw boom.conflict(`Reverse pair exists: ${_id}`)
    }
    _id = pair.pair.join('')
    try {
      const {ops} = await pairs.insertOne({...pair, _id})
      return ops[0]
    } catch (e) {
      const error = e as MongoError
      if (error.code === MongoErrorCodes.duplicateKey) {
        throw boom.conflict(`Pair exists: ${_id}`)
      }
      throw boom.internal(error.message)
    }
  },
  async update(_id: string, pair: Pair) {
    const pairs = getPairs()
    const {matchedCount,upsertedCount} = await pairs.updateOne({_id}, {$set: pair})
    if (!matchedCount) {
      throw boom.notFound(`Pair not found: ${_id}`)
    }
    return !!upsertedCount
  },
  async delete(_id: string) {
    const pairs = getPairs()
    const {deletedCount} = await pairs.deleteOne({_id})
    return !!deletedCount
  },
}
