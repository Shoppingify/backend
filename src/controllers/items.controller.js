const knex = require("../db/connection");
const Joi = require("@hapi/joi");
const { ValidationError } = require("@hapi/joi");
const { formatValidationErrors } = require("../utils/formatValidationErrors");
const { where } = require("../db/connection");

const createItemSchema = Joi.object().keys({
  name: Joi.string().trim().required(),
  note: Joi.string().trim(),
  image: Joi.string().trim().uri(),
  category: Joi.string().trim().required(),
});

const updateItemSchema = Joi.object().keys({
  name: Joi.string().trim(),
  note: Joi.string().trim(),
  image: Joi.string().trim().uri(),
  category: Joi.string().trim(),
});

// Fetch the items grouped by categories
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

// Create an item
exports.create = async (ctx) => {
  try {
    const valid = await createItemSchema.validateAsync(ctx.request.body);

    const { name, note, image, category } = ctx.request.body;

    // Check if the category exists
    const cat = await knex("categories")
      // .where("user_id", ctx.state.user.id)
      // .orWhere("user_id", null)
      .whereRaw("(user_id IS NULL OR user_id = ?)", [ctx.state.user.id])
      .andWhere("name", "ILIKE", `%${category}%`)
      .select("id");

    if (cat.length === 1) {
      // The category exists so I just need to insert the item
      const newItem = await knex("items")
        .returning("*")
        .insert({
          name,
          note: note || "",
          image: image || "",
          category_id: cat[0].id,
          user_id: ctx.state.user.id,
        });

      ctx.status = 201;
      ctx.body = {
        status: "success",
        data: newItem[0],
      };
    } else {
      // Create a new Category
      const newCategory = await knex("categories").returning("id").insert({
        name: category,
        user_id: ctx.state.user.id,
      });

      // Create a new Item with the new category associated
      const newItem = await knex("items")
        .returning("*")
        .insert({
          name,
          note: note || "",
          image: image || "",
          category_id: newCategory[0],
          user_id: ctx.state.user.id,
        });

      ctx.status = 201;
      ctx.body = {
        status: "success",
        data: newItem[0],
      };
    }
  } catch (e) {
    console.log(`E`, e);
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
  }
};

// Update an item
exports.update = async (ctx) => {
  const { id } = ctx.params;

  try {
    // fetch the item
    const item = await knex("items")
      .where("id", id)
      .andWhere("user_id", ctx.state.user.id)
      .select("id");
    if (item.length !== 1) {
      ctx.status = 404;
      ctx.body = {
        status: "error",
        message: "Item not found",
      };
      return ctx;
    }

    await updateItemSchema.validateAsync(ctx.request.body);

    const { name, note, image, category } = ctx.request.body;

    // Check if the category exists
    const cat = await knex("categories")
      // .where("user_id", ctx.state.user.id)
      // .orWhere("user_id", null)
      .whereRaw("(user_id IS NULL OR user_id = ?)", [ctx.state.user.id])
      .andWhere("name", "ILIKE", `%${category}%`)
      .select("id");

    if (cat.length === 1) {
      // The category exists so I just need to insert the item
      const newItem = await knex("items")
        .where("id", id)
        .update(
          {
            name,
            note: note || "",
            image: image || "",
            category_id: cat[0].id,
            user_id: ctx.state.user.id,
          },
          ["*"]
        );

      ctx.status = 200;
      ctx.body = {
        status: "success",
        data: newItem[0],
      };
    } else {
      // Create a new Category
      const newCategory = await knex("categories").returning("id").insert({
        name: category,
        user_id: ctx.state.user.id,
      });

      // Create a new Item with the new category associated
      const newItem = await knex("items")
        .where("id", id)
        .update(
          {
            name,
            note: note || "",
            image: image || "",
            category_id: newCategory[0],
            user_id: ctx.state.user.id,
          },
          ["*"]
        );

      ctx.status = 200;
      ctx.body = {
        status: "success",
        data: newItem[0],
      };
    }
  } catch (e) {
    console.log(`E`, e);
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
  }
};

exports.delete = async (ctx) => {
  const { id } = ctx.params;
  // console.log(`id`, id);
  try {
    await knex("items")
      .where("id", id)
      .andWhere("user_id", ctx.state.user.id)
      .del();

    ctx.status = 204;
  } catch (e) {
    console.log(`E`, e);
    ctx.status = e.status || 500;
    ctx.message = "An error occured";
  }
};
