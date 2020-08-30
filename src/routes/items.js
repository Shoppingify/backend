const Router = require("@koa/router");
const itemsController = require("../controllers/items.controller");
const jwt = require("../middlewares/jwt");

const router = new Router();

router.get("/items", jwt, itemsController.index);
router.post("/items", jwt, itemsController.create);
router.put("/items/:id", jwt, itemsController.update);
router.delete("/items/:id", jwt, itemsController.delete);

module.exports = router;
