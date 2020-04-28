import joi from '@hapi/joi'

export const EmptySchema = joi.symbol().label('Empty')
export const BoomSchema = joi.object({
  statusCode: joi.number().min(400),
  error: joi.string(),
  message: joi.string(),
}).label('Error')

export const SymbolSchema = joi.string().uppercase().min(3).max(3).label('Symbol')
export const SymbolIdSchema = joi.string().uppercase().min(6).max(6).label('SymbolId')
export const SymbolArraySchema = joi.array().items(SymbolSchema).label('SymbolArray')

export const FeeSchema = joi.object({
  min: joi.number(),
  max: joi.number(),
  amount: joi.alternatives().conditional('isFlat', {
    is: true,
    then: joi.number().min(0),
    otherwise: joi.number().min(0).max(100),
  }).required(),
  isFlat: joi.boolean(),
}).label('Fee')
export const FeeArraySchema = joi.array().items(FeeSchema).label('FeeArray')
export const FeeCollectionSchema = joi.alternatives(
  joi.object({buy: FeeArraySchema, sell: FeeArraySchema}),
  FeeArraySchema,
).label('FeeCollection')

const pair = {
  id: SymbolIdSchema,
  pair: joi.array().items(SymbolSchema).min(2).max(2).required().label('SymbolPair'),
  fees: FeeCollectionSchema,
}
export const PairSchema = joi.object(pair).label('Pair')
export const PairArraySchema = joi.array().items(PairSchema).label('PairArray')
const {id: pairId, ...pairBody} = pair
export const PairIdSchema = joi.object({id: pairId}).label('PairId')
export const PairBodySchema = joi.object(pairBody).label('PairBody')
export const PairFeesSchema = joi.object({fees: pair.fees}).label('PairFees')

export const ExchangeSchema = joi.object({
  ttl: joi.number(),
  date: joi.date(),
  timestamp: joi.number(),
  base: SymbolSchema,
  rates: joi.object().pattern(SymbolSchema, joi.number()).label('Rates'),
}).label('Exchange')
export const ExchangePairSchema = joi.object({
  ...pair,
  rate: joi.number(),
}).label('ExchangePair')
export const ExchangeAmountSchema = joi.object({
  pair: pairId,
  amount: joi.number(),
}).label('ExchangePrice')
export const ExchangePriceSchema = joi.object({
  base: joi.number(),
  buy: joi.number(),
  sell: joi.number(),
}).label('ExchangePrice')
