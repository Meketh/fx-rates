import {ServerRoute} from '@hapi/hapi'
import boom from '@hapi/boom'
import {Pair, pairs} from '../db'
import {MethodsDictionary} from '../methods'
import {
  EmptySchema,
  BoomSchema,
  PairSchema,
  PairIdSchema,
  PairBodySchema,
  PairFeesSchema,
  PairArraySchema,
} from '../schemas'

function failAction(r, h, e) { throw e }
export const pair = [{
  method: 'GET',
  path: '/api/pair',
  options: {
    tags: ['api', 'pair'],
    description: 'Gets all the pairs',
    response: {
      failAction: 'log',
      status: {
        200: PairArraySchema,
      }
    },
  },
  async handler(req, res) {
    return res.response(await pairs.all()).code(200)
  }
}, {
  method: 'GET',
  path: '/api/pair/{id}',
  options: {
    tags: ['api', 'pair'],
    description: 'Gets one pair',
    validate: {failAction, params: PairIdSchema},
    response: {
      failAction: 'log',
      status: {
        200: PairSchema,
        400: BoomSchema,
        404: BoomSchema,
      }
    },
  },
  async handler(req, res) {
    const pair = await pairs.find(req.params.id)
    return res.response(pair).code(200)
  }
}, {
  method: 'POST',
  path: '/api/pair',
  options: {
    tags: ['api', 'pair'],
    description: 'Stores the new pair',
    notes: 'It can recieve a `FeeArray` instead of a `FeeCollection` as fees',
    validate: {failAction, payload: PairBodySchema},
    response: {
      failAction: 'log',
      status: {
        201: PairIdSchema,
        400: BoomSchema,
        409: BoomSchema,
      }
    },
  },
  async handler(req, res) {
    const pair = req.payload as Pair
    const methods = req.server.methods as MethodsDictionary
    const fx = await methods.getExchange()
    for (const symbol of pair.pair) {
      if (!fx.rates[symbol]) {
        throw boom.notFound(`Symbol not found: ${symbol}`)
      }
    }
    const id = await pairs.insert(pair)
    return res.response({id}).code(201)
  }
}, {
  method: 'PUT',
  path: '/api/pair/{id}',
  options: {
    tags: ['api', 'pair'],
    description: 'Updates the pair',
    notes: 'It can recieve a `FeeArray` instead of a `FeeCollection` as fees',
    validate: {failAction, params: PairIdSchema, payload: PairFeesSchema},
    response: {
      failAction: 'log',
      status: {
        200: EmptySchema,
        400: BoomSchema,
        404: BoomSchema,
      }
    }
  },
  async handler(req, res) {
    await pairs.update(req.params.id, req.payload as Pair)
    return res.response().code(200)
  }
}, {
  method: 'DELETE',
  path: '/api/pair/{id}',
  options: {
    tags: ['api', 'pair'],
    description: 'Deletes the pair',
    validate: {failAction, params: PairIdSchema},
    response: {
      failAction: 'log',
      status: {
        204: EmptySchema,
        400: BoomSchema,
      }
    }
  },
  async handler(req, res) {
    await pairs.delete(req.params.id)
    return res.response().code(204)
  }
}] as ServerRoute[]
