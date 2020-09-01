const Router = require("@koa/router");
const itemsListsController = require("../controllers/items_lists.controller");
const jwt = require("../middlewares/jwt");

const router = new Router();

router.post("/lists/:listId/items", jwt, itemsListsController.create);

module.exports = router;
