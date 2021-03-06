const Router = require('@koa/router')
const categoriesController = require('../controllers/categories.controller')
const jwt = require('../middlewares/jwt')

const router = new Router()

router.get('/categories', jwt, categoriesController.index)
router.put('/categories/:id', jwt, categoriesController.update)
router.delete('/categories/:id', jwt, categoriesController.delete)

module.exports = router
