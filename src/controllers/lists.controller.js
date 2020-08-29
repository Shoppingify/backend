const { isOwner } = require("../utils/isOwner");
const knex = require("../db/connection");
const Joi = require("@hapi/joi");
const { ValidationError } = require("@hapi/joi");
const { formatValidationErrors } = require("../utils/formatValidationErrors");

const listSchema = Joi.object().keys({
  name: Joi.string().min(3).required(),
});

const listUpdateSchema = Joi.object().keys({
  name: Joi.string().min(3).required(),
  status: Joi.string().valid("active", "completed", "canceled"),
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

exports.show = async (ctx) => {
  try {
    const list = await knex("lists").where({
      id: parseInt(ctx.params.id, 10),
      user_id: ctx.state.user.id,
    });

    if (list.length === 0) {
      ctx.status = 404;
      ctx.body = {
        status: "error",
        message: "List not found",
      };
      return ctx;
    }

    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: list[0],
    };
  } catch (e) {
    console.log(`Error`, e);
    ctx.status = e.status || 500;
    ctx.body = {
      status: "error",
      message: "An error occured",
    };
  }
};

exports.create = async (ctx) => {
  try {
    await listSchema.validateAsync(ctx.request.body);

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

exports.update = async (ctx) => {
  try {
    // Fetch the list
    const list = await knex("lists").where({
      id: parseInt(ctx.params.id, 10),
      user_id: ctx.state.user.id,
    });

    if (list.length === 0) {
      ctx.status = 404;
      ctx.body = {
        status: "error",
        message: "List not found",
      };
      return ctx;
    }
    await listUpdateSchema.validateAsync(ctx.request.body);

    const { name, status } = ctx.request.body;

    const updatedList = await knex("lists")
      .where({ id: list[0].id })
      .update(
        {
          name,
          status: status ? status : list[0].status,
          user_id: ctx.state.user.id,
        },
        ["id", "name", "user_id"]
      );
    console.log(`Updated list`, updatedList);
    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: updatedList[0],
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

// Delete a list
exports.delete = async (ctx) => {
  try {
    const list = await knex("lists").where({
      id: parseInt(ctx.params.id, 10),
      user_id: ctx.state.user.id,
    });

    if (list.length !== 1) {
      ctx.status = 404;
      ctx.body = {
        status: "error",
        message: "List not found",
      };
    }

    await knex("lists").where({ id: list[0].id }).del();
    ctx.status = 204;
  } catch (e) {
    console.log(`Error`, e);
    ctx.status = e.status || 500;
    ctx.body = {
      status: "error",
      message: "An error occured",
    };
  }
};
