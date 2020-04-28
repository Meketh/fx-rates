import {ServerMethodConfigurationObject} from '@hapi/hapi'
import axios from 'axios'
import {config} from '../config'

export interface Exchange {
  ttl: number
  date: string
  timestamp: number
  base: string
  rates: { [symbol: string]: number }
}

export const getExchange = {
  name: 'getExchange',
  options: {
    cache: {
      expiresIn: config.rates.ttl,
      generateTimeout: false,
    }
  },
  async method(flags) {
    const {data: fx} = await axios.get<Exchange>(config.rates.url)
    fx.timestamp *= 1e3
    fx.date = new Date(fx.timestamp).toUTCString()
    fx.ttl = flags.ttl = config.rates.ttl + fx.timestamp - Date.now()
    return fx
  }
} as ServerMethodConfigurationObject
