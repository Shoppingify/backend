const Router = require("@koa/router");
const listsController = require("../controllers/lists.controller");
const jwt = require("../middlewares/jwt");

const router = new Router();

router.get("/lists", jwt, listsController.index);
router.post("/lists", jwt, listsController.create);

module.exports = router;
