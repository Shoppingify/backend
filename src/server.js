const path = require("path");
const fs = require("fs");
const morgan = require("koa-morgan");
const swagger = require("swagger2");
const { ui, validate } = require("swagger2-koa");
require("dotenv").config({
  path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`),
});

const Koa = require("koa");
const Router = require("@koa/router");
const cors = require("@koa/cors");
const bodyParser = require("koa-bodyparser");
const authRoutes = require("./routes/auth");
const listsRoutes = require("./routes/lists");
const app = new Koa();
const router = new Router({ prefix: "/api" });

// Setup morgan
const accessLogStream = fs.createWriteStream(__dirname + "/logs/access.log", {
  flags: "a",
});

// create swagger document
const swaggerDocument = swagger.loadDocumentSync(
  path.join(__dirname, "documentation", "api.yaml")
);

app.use(morgan("combined", { stream: accessLogStream }));

// Errors handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err.message;
    ctx.app.emit("error", err, ctx);
  }
});

app.on("error", (err, ctx) => {
  console.log(`Error handler`, err);
});

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser());

router.use(authRoutes.routes());
router.use(listsRoutes.routes());

app.use(ui(swaggerDocument, "/swagger"));
app.use(router.routes());
app.use(router.allowedMethods());

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});

module.exports = server;
