import path from 'path'
import hapi from '@hapi/hapi'
import inert from '@hapi/inert'
import vision from '@hapi/vision'
import good from '@hapi/good'
import swagger from 'hapi-swagger'
import {methods} from './methods'
import {routes} from './routes'
import {config} from './config'
import {client} from './db'
import {consoleReporter} from './consoleReporter'

async function startServer() {
  const server = hapi.server({
    port: config.port,
    routes: {
      cors: true,
      files: {relativeTo: path.join(__dirname, 'public')},
    }
  })

  await server.register([inert, vision])
  await server.register([{
    plugin: swagger,
    options: {
      cors: true,
      grouping: 'tags',
      basePath: '/api',
      jsonPath: '/api/docs.json',
      documentationPath: '/api/docs',
      info: {
        title: 'Test API Documentation',
      }
    }
  }, {
    plugin: good,
    options: {
      ops: {interval: 60e3},
      reporters: {console: consoleReporter}
    }
  }])

  server.method(methods)
  server.route(routes)
  server.route({
    method: 'GET',
    path: '/{path*}',
    handler: {
      directory: {path: '.', index: 'client.html'}
    }
  })

  await client.connect()
  await server.start()
  console.info(`Server started at ${server.info.uri}`);
}

process.on('unhandledRejection', error => {
  console.log(error)
  process.exit(1)
})

startServer()
