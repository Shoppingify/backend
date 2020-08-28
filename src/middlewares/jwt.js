const jsonwebtoken = require("jsonwebtoken");

const middleware = async function jwt(ctx, next) {
  //Grab the token
  const token = getJwtToken(ctx);
  try {
    //Try and decode the token asynchronously
    const decoded = await jsonwebtoken.verify(token, process.env.JWT_SECRET);

    //If it worked set the ctx.state.user parameter to the decoded token.
    ctx.state.user = decoded.data;
  } catch (error) {
    //If it's an expiration error, let's report that specifically.
    if (error.name === "TokenExpiredError") {
      ctx.status = 401;
      ctx.body = {
        message: "Token expired",
      };
      return ctx;
    } else {
      ctx.status = 401;
      ctx.body = {
        message: "Invalid token",
      };
      return ctx;
    }
  }

  return next();
};

function getJwtToken(ctx) {
  if (!ctx.header || !ctx.header.authorization) {
    return;
  }

  const parts = ctx.header.authorization.split(" ");

  if (parts.length === 2) {
    const scheme = parts[0];
    const credentials = parts[1];

    if (/^Bearer$/i.test(scheme)) {
      return credentials;
    }
  }
  ctx.status = 401;
  ctx.body = {
    message: "Unauthorized",
  };
  return ctx;
}

module.exports = middleware;
