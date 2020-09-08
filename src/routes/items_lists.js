const Router = require('@koa/router')
const itemsListsController = require('../controllers/items_lists.controller')
const jwt = require('../middlewares/jwt')

const router = new Router()

router.get('/lists/:listId/items', jwt, itemsListsController.index)
router.post('/lists/:listId/items', jwt, itemsListsController.create)
router.put('/lists/:listId/items', jwt, itemsListsController.update)
router.delete('/lists/:listId/items', jwt, itemsListsController.delete)

module.exports = router
