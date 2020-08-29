const knex = require("../db/connection");
const Joi = require("@hapi/joi");
const { ValidationError } = require("@hapi/joi");
const { formatValidationErrors } = require("../utils/formatValidationErrors");

exports.index = async (ctx) => {
  // Maybe I should add some pagination on the items

  try {
    const categories = await knex("categories")
      .where({
        user_id: null,
      })
      .orWhere({ user_id: ctx.state.user.id })
      .select("*");

    const items = await knex("items")
      .where({
        user_id: ctx.state.user.id,
      })
      .select("*");

    let results = [];
    categories.forEach((cat) => {
      console.log(`cat`, cat);
      results.push({
        category: cat.name,
        items: [],
      });
      items.forEach((item) => {
        if (item.category_id === cat.id) {
          console.log(`Cat name`, cat.name);
          const index = results.findIndex((r) => r.category === cat.name);
          if (index !== -1) {
            results[index].items.push(item);
          }
        }
      });
    });

    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: results,
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
