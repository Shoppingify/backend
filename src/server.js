const path = require('path')
const fs = require('fs')
const morgan = require('koa-morgan')
const swagger = require('swagger2')
const { ui, validate } = require('swagger2-koa')

require('dotenv').config({
  path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`),
})

const Koa = require('koa')
const Router = require('@koa/router')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const authRoutes = require('./routes/auth')
const listsRoutes = require('./routes/lists')
const itemsRoutes = require('./routes/items')
const itemsListsRoutes = require('./routes/items_lists')
const categoriesRoutes = require('./routes/categories')
const statsRoutes = require('./routes/stats')
const app = new Koa()
const router = new Router({ prefix: '/api' })

// create swagger document
const swaggerDocument = swagger.loadDocumentSync(
  path.join(__dirname, 'documentation', 'api.yaml')
)

if (process.env.NODE_ENV === 'development') {
  const accessLogStream = fs.createWriteStream(__dirname + '/logs/access.log', {
    flags: 'a',
  })
  app.use(morgan('combined', { stream: accessLogStream }))
}
// Setup morgan

// Errors handling
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.log(`Error handler`, err)
    ctx.status = err.status || 500
    ctx.body = err.message
    ctx.app.emit('error', err, ctx)
  }
})

app.on('error', (err, ctx) => {
  console.log(`Error handler`, err)
})

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
)

app.use(bodyParser())

// Api routes
router.use(authRoutes.routes())
router.use(listsRoutes.routes())
router.use(itemsRoutes.routes())
router.use(itemsListsRoutes.routes())
router.use(categoriesRoutes.routes())
router.use(statsRoutes.routes())

app.use(ui(swaggerDocument, '/swagger'))
app.use(router.routes())
app.use(router.allowedMethods())

const server = app.listen(process.env.PORT, () => {})

module.exports = server
