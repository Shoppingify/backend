const { isOwner } = require("../utils/isOwner");
const knex = require("../db/connection");
const Joi = require("@hapi/joi");
const { ValidationError } = require("@hapi/joi");
const { formatValidationErrors } = require("../utils/formatValidationErrors");

const itemCreateSchema = Joi.object().keys({
  id: Joi.number().required(),
  quantity: Joi.number().required(),
});
const listSchema = Joi.object().keys({
  name: Joi.string().min(3).trim().required(),
  items: Joi.array().items(itemCreateSchema),
});

const listUpdateSchema = Joi.object().keys({
  name: Joi.string().min(3).trim(),
  status: Joi.string().valid("active", "completed", "canceled"),
  items: Joi.array().items(itemCreateSchema),
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

    const { name, items } = ctx.request.body;

    console.log(`Items`, items);

    const [list] = await knex("lists").returning("*").insert({
      name,
      user_id: ctx.state.user.id,
    });

    // If I have some items I should insert them
    let itemsInserted = null;
    if (items) {
      try {
        const itemsToInsert = items.map((item) => {
          return {
            item_id: item.id,
            list_id: list.id,
            quantity: item.quantity,
          };
        });
        itemsInserted = await knex("items_lists").insert(itemsToInsert, ["*"]);
        console.log(`Items inserted `, items);
      } catch (e) {
        console.log(`Error while inserting the items`, e);
      }
    }

    ctx.status = 201;
    ctx.body = {
      status: "success",
      data: {
        list,
        items: itemsInserted || [],
      },
    };
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
    console.log(`Error`, e);
  }
};

exports.update = async (ctx) => {
  const { name, status, items } = ctx.request.body;
  if (!name && !status) {
    ctx.status = 400;
    ctx.body = {
      status: "error",
      message: "Name or status are missing",
    };
    return ctx;
  }
  try {
    // Fetch the list
    const [list] = await knex("lists").where({
      id: parseInt(ctx.params.id, 10),
      user_id: ctx.state.user.id,
    });

    if (!list) {
      ctx.status = 404;
      ctx.body = {
        status: "error",
        message: "List not found",
      };
      return ctx;
    }
    await listUpdateSchema.validateAsync(ctx.request.body);

    const [updatedList] = await knex("lists")
      .where({ id: list.id })
      .update(
        {
          name,
          status: status ? status : list.status,
          user_id: ctx.state.user.id,
        },
        ["id", "name", "user_id"]
      );
    console.log(`Updated list`, updatedList);

    // Items
    // I fetch all the items from the list
    let newItems;
    if (items) {
      newItems = await synchronizeItems(items, list);
    }

    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: {
        list: updatedList,
        items: newItems || [],
      },
    };
  } catch (e) {
    if (e instanceof ValidationError) {
      ctx.status = 422;
      ctx.body = await formatValidationErrors(e);
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

const synchronizeItems = async (items, list) => {
  const currentItems = await knex("items_lists").where({ list_id: list.id });
  // If I have less items from the request than I have in the db,
  // I delete those items
  const t = await knex.transaction();

  try {
    const toDelete = currentItems.filter(
      (x) => !items.find((i) => i.id === x.id)
    );

    console.log(`To delete`, toDelete);
    if (toDelete.length > 0) {
      // Delete items
      await t("items_lists")
        .whereIn(
          "id",
          toDelete.map((i) => i.id)
        )
        .del();
    }

    const toInsert = items
      .filter((x) => !currentItems.find((i) => i.id === x.id))
      .map((i) => {
        return {
          item_id: i.id,
          list_id: list.id,
          quantity: i.quantity,
        };
      });
    console.log(`To insert`, toInsert);
    if (toInsert.length > 0) {
      await t("items_lists").insert(toInsert, ["*"]);
    }

    const toUpdate = items.filter((x) => {
      return currentItems.find(
        (i) => i.id === x.id && i.quantity !== x.quantity
      );
    });
    console.log(`ToUpdate`, toUpdate);
    if (toUpdate.length > 0) {
      toUpdate.forEach(async (item) => {
        await t("items_lists")
          .where("item_id", item.id)
          .update("quantity", item.quantity);
      });
    }
    const itemsInList = await t("items_lists").where("list_id", list.id);

    t.commit();
    console.log(`itemsInList`, itemsInList);

    return itemsInList;
  } catch (e) {
    t.rollback();
    console.log(`Error synchronizing items`, e);
    return [];
  }
};
