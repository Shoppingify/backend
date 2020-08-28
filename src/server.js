require("dotenv-flow").config();
const Koa = require("koa");
const Router = require("@koa/router");
const cors = require("@koa/cors");
const bodyParser = require("koa-bodyparser");
const authRoutes = require("./routes/auth");

const app = new Koa();
const router = new Router({ prefix: "/api" });

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser());

// router.get("/", async (ctx) => {
//   ctx.body = { message: "Hello World" };
// });
router.use(authRoutes.routes());
app.use(router.routes());
app.use(router.allowedMethods());

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});

module.exports = server;
