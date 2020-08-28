const { isOwner } = require("../utils/isOwner");

exports.index = async (ctx) => {
  console.log(`ctx params`, ctx.params.userId);
  console.log(`ctx state user`, ctx.state.user.id);

  console.log(`isOwnerTest`, await isOwner("users", { id: ctx.state.user.id }));

  // if (!isOwner("lists", "user_id", ctx.state.user.id)) {
  //   ctx.status = 403;
  //   ctx.body = {
  //     status: "error",
  //     message: "Access forbidden",
  //   };
  // }
  if (ctx.state.user.id !== parseInt(ctx.params.userId, 10)) {
    ctx.status = 403;
    ctx.body = {
      status: "error",
      message: "Access forbidden",
    };
  } else {
    ctx.body = [];
  }
};
