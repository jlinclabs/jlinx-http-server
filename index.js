import Debug from 'debug'
import { promisify } from 'node:util'
import Path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import ExpressPromiseRouter from 'express-promise-router'
import hbs from 'express-hbs'
import bodyParser from 'body-parser'

import { isJlinxDid } from 'jlinx-util'
import JlinxClient from 'jlinx-client'

const debug = Debug('jlinx:http-server')

const __dirname = Path.resolve(fileURLToPath(import.meta.url), '..')

function getEnvVar(prop){
  const value = process.env[prop]
  if (!value)
    throw new Error(`jlinx http server requires environment variable ${prop}`)
  return value
}

const app = express()
export default app

app.port = getEnvVar('PORT')
app.storagePath = getEnvVar('JLINX_STORAGE')
app.start = async function start(){
  debug('starting')
  app.jlinx = new JlinxClient({
    storagePath: app.storagePath,
  })

  debug('connecting to jlinx…')
  app.ready = app.jlinx.connected().then(async () => {
    const { agentPublicKey } = await app.jlinx.config.read()
    app.locals.agentPublicKey = agentPublicKey
    console.log(`jlinx agent public key: ${agentPublicKey}`)
  })

  app.server = await promisify(app.listen).call(app, app.port)
  console.log(`jlinx http server running http://localhost:${app.port}`)
}

app.stop = async function stop() {
  if (app.jlinx) promises.push(app.jlinx.destroy())
  if (app.server) promises.push(app.server.stop())
  await Promise.all(promises)
}

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ }))

// RENDER HTML
app.engine('hbs', hbs.express4({
  // partialsDir: __dirname + `${views}/partials`,
  defaultLayout: __dirname + `/views/layout.hbs`,
}))
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')

function renderError(req, res, error, statusCode = 401){
  console.error(error)
  res.status(statusCode)
  if (req.accepts('html')) return res.render('error', { error })
  // if (req.accepts('json'))
  else return res.json({ error })
}

// ROUTES
app.routes = new ExpressPromiseRouter
app.use(app.routes)

app.routes.use(async (req, res, next) => {
  debug(req.method, req.url)
  await app.ready
  next()
})

app.routes.get('/', async (req, res, next) => {
  const { did } = req.query
  if (did && did.startsWith('did:')) return res.redirect(`/${did}`)

  if (req.accepts('html')) return res.render('index')
  next()
})

app.routes.use(/^\/(did:.+)$/, async (req, res, next) => {
  req.did = req.params[0]
  if (!isJlinxDid(req.did))
    renderError(req, res, `invalid did DID=${req.did}`, 400)
  else
    next()
})

app.routes.get(/^\/(did:.+)$/, async (req, res, next) => {
  const { did } = req
  const didDocument = await app.jlinx.resolveDid(did)
  if (!didDocument) return renderError(req, res, `unable to resolve DID=${did}`, 404)
  if (req.accepts('html'))
    return res.render('did', {
      did, json: JSON.stringify(didDocument, null, 2)
    })
  return res.json(didDocument)
})

app.routes.get('/status', async (req, res, next) => {
  const status = await app.jlinx.server.hypercore.status()
  res.json({
    hypercore: status,
  })
})

app.routes.post('/new', async (req, res, next) => {
  const { did, secret } = await app.jlinx.server.createDid()
  res.json({ did, secret })
})

app.routes.post(/^\/(did:.+)$/, async (req, res, next) => {
  const { did } = req
  const { secret, value } = req.body
  debug('amending did')
  await app.jlinx.server.amendDid({
    did, secret, value
  })
  res.json({})
})
