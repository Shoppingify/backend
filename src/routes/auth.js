const Router = require("@koa/router");
const authController = require("../controllers/auth.controller");
const jwt = require("../middlewares/jwt");

const router = new Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", jwt, authController.me);

module.exports = router;
