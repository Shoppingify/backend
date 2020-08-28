const Router = require("@koa/router");
const authController = require("../controllers/auth.controller");

const router = new Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
