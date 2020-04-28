import * as React from 'react'
import {render} from 'react-dom'
import axios from 'axios'
import {config} from '../config'
import {Pair} from '../db'

const {useState, useEffect} = React
const api = axios.create({baseURL: config.apiUrl})

function useFetch<T>(url: string): [T, () => void] {
  const [state, set] = useState<T>()
  function fetch() {
    api.get<T>(url).then(r => set(r.data))
  }
  useEffect(fetch, [])
  return [state, fetch]
}

function h(set) { return e => set(e.target.value) }

function App() {
  const [symbols] = useFetch<string[]>('exchange/symbols')
  const [pairs, fetchPairs] = useFetch<Pair[]>('pair')
  const [pair, setPair] = useState<Pair>()
  const [base, setBase] = useState('USD')
  const [quote, setQuote] = useState('ARS')
  useEffect(() => {
    if (!pairs) return
    const p = pairs.find(p => p.pair[0] === base && p.pair[1] === quote)
    if (p !== pair) {
      setPair(p)
      if (p) {
        setFee(p ? p.fees[0].amount : 0)
        api.get(`exchange/${p.id}/1`).then(r => setPrice(r.data.price))
      } else {
        setFee(0)
        setPrice({})
      }
    }
  }, [pairs, pair, base, quote])
  const [fee, setFee] = useState(0)
  const [price, setPrice] = useState({})
  function selectPair(p: Pair) {
    setBase(p.pair[0])
    setQuote(p.pair[1])
  }
  function addPair() {
    api.post('pair', {
      pair: [base, quote],
      fees: [{amount: fee}],
    }).then(fetchPairs)
  }
  function putPair() {
    api.put(`pair/${pair.id}`, {fees:[{amount: fee}]}).then(fetchPairs)
  }
  function delPair() {
    api.delete(`pair/${pair.id}`).then(fetchPairs)
  }
  return (<div>
    {!symbols ? <div>Loading symbols...</div> : <div>
      Base <select value={base} onChange={h(setBase)}>
        {symbols.map(s => <option key={s}>{s}</option>)}
      </select>
      Quote <select value={quote} onChange={h(setQuote)}>
        {symbols.map(s => <option key={s}>{s}</option>)}
      </select>
      Fee <input style={{width: 50}}
        value={fee} onChange={h(setFee)}
        type="number" min="0" max="100"
      />
      {pair
        ? <span>
          <button onClick={putPair}>update</button>
          <button onClick={delPair}>delete</button>
        </span>
        : <button onClick={addPair}>add</button>
      }
      <pre>{JSON.stringify(price, null, 2)}</pre>
    </div>}
    {!pairs ? <div>Loading pairs...</div> : <ul>{
      pairs.map(p => <li key={p.id}>
        <button onClick={() => selectPair(p)}>{p.pair.join('/')}</button>
      </li>)
    }</ul>}
  </div>)
}

render(<App/>, document.getElementById('app'))
