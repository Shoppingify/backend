const Router = require('@koa/router')
const statsController = require('../controllers/stats.controller')
const jwt = require('../middlewares/jwt')

const router = new Router()

router.get('/stats', jwt, statsController.index)

module.exports = router
