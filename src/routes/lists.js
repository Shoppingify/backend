const Router = require("@koa/router");
const listsController = require("../controllers/lists.controller");
const jwt = require("../middlewares/jwt");

const router = new Router();

router.get("/lists", jwt, listsController.index);
router.get("/lists/:id", jwt, listsController.show);
router.post("/lists", jwt, listsController.create);
router.put("/lists/:id", jwt, listsController.update);

module.exports = router;
