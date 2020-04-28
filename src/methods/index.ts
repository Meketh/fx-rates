import {ServerMethods} from '@hapi/hapi'
import {getExchange, Exchange} from './getExchange'

export const methods = [
  getExchange
]

export interface MethodsDictionary extends ServerMethods {
  getExchange(): Promise<Exchange>
}
