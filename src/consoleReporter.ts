import {Transform} from 'stream'

enum Colors {black=30, red, green, yellow, blue, magenta, cyan, white}
enum Background {black=40, red, green, yellow, blue, magenta, cyan, white}
enum Decorations {bold=1, soft, italic, underline}
function setStyle(text, ...styles) {
  return `\x1b[${styles.join(';')}m${text}\x1b[0m`
}
function setMethodColor(method) {
  return setStyle(method.toUpperCase(), Decorations.bold, ({
    get: Colors.cyan,
    post: Colors.green,
    put: Colors.yellow,
    delete: Colors.red
  })[method.toLowerCase()])
}
function formatQuery(query) {
  const kvs = Object.entries(query)
  return kvs.length ? `?{${kvs.map(kv => kv.join(': ')).join(', ')}}` : ''
}
function setStatusColor(status) {
  return setStyle(status, Decorations.bold,
    status >= 500 ? Colors.red
    : status >= 400 ? Colors.yellow
    : status >= 300 ? Colors.cyan
    : Colors.green
  )
}

export const consoleReporter = [
  new Transform({
    objectMode:true,
    transform(data, _, cb) {
      let text = `${setStyle(data.timestamp, Colors.white, Decorations.bold)}: `
      switch (data.event) {
        case 'ops': {
          const h = setStyle(data.host, Colors.white, Decorations.bold)
          const m = setStyle(Math.round(data.proc.mem.rss / 1024**2), Colors.cyan)
          const u = setStyle(data.proc.uptime, Colors.green, Decorations.bold)
          text += `host: ${h}, mem: ${m} MB, uptime: ${u} s`
          break
        }
        case 'response': {
          const m = setMethodColor(data.method)
          const p = setStyle(data.path, Decorations.bold)
          const q = formatQuery(data.query)
          const s = setStatusColor(data.statusCode)
          text += `${m} ${p}${q} ${s} (${data.responseTime}ms)`
          break
        }
        case 'error': {
          const m = setStyle(data.error.message, Colors.red, Decorations.bold)
          const stack = data.error.stack.replace(/\n/img, `\n\x1b[${Decorations.bold}m`)
          const s = setStyle(stack, Decorations.bold)
          text += `message: ${m}, stack: ${s}`
          break
        }
        default: text += JSON.stringify(data, null, 2)
      }
      cb(null, `${text}\n`)
    }
  }),
  'stdout',
]
