const { isOwner } = require("../utils/isOwner");
const knex = require("../db/connection");
const Joi = require("@hapi/joi");
const { ValidationError } = require("@hapi/joi");
const { formatValidationErrors } = require("../utils/formatValidationErrors");

const createSchema = Joi.object().keys({
  name: Joi.string().min(3).required(),
});

exports.index = async (ctx) => {
  // Fetch the lists
  try {
    const lists = await knex("lists")
      .where({
        user_id: ctx.state.user.id,
      })
      .select("*");

    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: lists,
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = {
      status: "error",
      message: "An error occured",
    };
  }
};

exports.create = async (ctx) => {
  try {
    await createSchema.validateAsync(ctx.request.body);

    const { name } = ctx.request.body;

    const list = await knex("lists").returning("*").insert({
      name,
      user_id: ctx.state.user.id,
    });
    ctx.status = 201;
    ctx.body = {
      status: "success",
      data: list[0],
    };
  } catch (e) {
    if (e instanceof ValidationError) {
      ctx.status = 422;
      ctx.body = formatValidationErrors(e);
    } else {
      ctx.status = e.status || 500;
      ctx.body = {
        status: "error",
        message: "An error occured",
      };
    }
    console.log(`Error`, e);
  }
};
