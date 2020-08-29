const Router = require("@koa/router");
const itemsController = require("../controllers/items.controller");
const jwt = require("../middlewares/jwt");

const router = new Router();

router.get("/items", jwt, itemsController.index);

module.exports = router;
