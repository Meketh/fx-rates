import {ServerRoute} from '@hapi/hapi'
import {pairs, Fee} from '../db'
import {MethodsDictionary} from '../methods'
import {
  SymbolArraySchema,
  ExchangeSchema,
  ExchangePairSchema,
  ExchangeAmountSchema,
  ExchangePriceSchema,
} from '../schemas'

export const exchange = [{
  method: 'GET',
  path: '/api/exchange/symbols',
  options: {
    tags: ['api', 'exchange'],
    description: 'Gets the exchange symbols',
    response: {
      failAction: 'log',
      status: {
        200: SymbolArraySchema,
      }
    },
  },
  async handler(req, res) {
    const methods = req.server.methods as MethodsDictionary
    const fx = await methods.getExchange()
    return res
      .response(Object.keys(fx.rates))
      .header('Last-modified', fx.date)
  }
}, {
  method: 'GET',
  path: '/api/exchange/rates',
  options: {
    tags: ['api', 'exchange'],
    description: 'Gets the exchange rates from source or cache',
    response: {
      failAction: 'log',
      status: {
        200: ExchangeSchema,
      }
    },
  },
  async handler(req, res) {
    const methods = req.server.methods as MethodsDictionary
    const fx = await methods.getExchange()
    return res
      .response(fx)
      .header('Last-modified', fx.date)
  }
}, {
  method: 'GET',
  path: '/api/exchange/pairs',
  options: {
    tags: ['api', 'exchange'],
    description: 'Gets the exchange pairs with rates',
    response: {
      failAction: 'log',
      status: {
        200: ExchangePairSchema,
      }
    },
  },
  async handler(req, res) {
    const methods = req.server.methods as MethodsDictionary
    const fx = await methods.getExchange()
    const allPairs = await pairs.all()
    return res.response(allPairs.map(p => ({...p,
      rate: fx.rates[p.pair[1]] / fx.rates[p.pair[0]]
    }))).code(200)
  }
}, {
  method: 'GET',
  path: '/api/exchange/{pair}/{amount}',
  options: {
    tags: ['api', 'exchange'],
    description: 'Gets the exchange pairs with rates',
    validate: {failAction(r, h, e) { throw e }, params: ExchangeAmountSchema},
    response: {
      failAction: 'log',
      status: {
        200: ExchangePriceSchema,
      }
    },
  },
  async handler(req, res) {
    const methods = req.server.methods as MethodsDictionary
    const fx = await methods.getExchange()
    const pair = await pairs.find(req.params.pair.toUpperCase())
    const rate = fx.rates[pair.pair[1]] / fx.rates[pair.pair[0]]
    const price = {base: +req.params.amount * rate}
    for (const action of ['buy', 'sell']) {
      const fees: Fee[] = Array.isArray(pair.fees) ? pair.fees : pair.fees[action] || []
      const aplicableFees = fees.filter(f =>
        (!f.min || f.min <= price.base) &&
        (!f.max || price.base < f.max)
      )
      function sumFees(filter) {
        return aplicableFees.filter(filter).reduce((r, f) => r + f.amount, 0)
      }
      const s = action === 'buy' ? +1 : -1
      price[action] = price.base
      price[action] *= 1 + s * sumFees(f => !f.isFlat) / 100
      price[action] += s * sumFees(f => f.isFlat)
    }
    return res.response({price}).code(200)
  }
}] as ServerRoute[]
