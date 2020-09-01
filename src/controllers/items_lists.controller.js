const knex = require("../db/connection");
const Joi = require("@hapi/joi");
const { ValidationError } = require("@hapi/joi");
const { formatValidationErrors } = require("../utils/formatValidationErrors");

const itemCreateSchema = Joi.object().keys({
  id: Joi.number().required(),
  quantity: Joi.number().required(),
});

const itemsListsSchema = Joi.object().keys({
  items: Joi.array().items(itemCreateSchema),
});

exports.index = async (ctx) => {
  try {
    const [list] = await knex("lists")
      .where("id", parseInt(ctx.params.listId, 10))
      .andWhere("user_id", ctx.state.user.id);
    console.log(`List`, list);
    if (!list) {
      ctx.status = 404;
      ctx.body = {
        status: "error",
        message: "List not found",
      };
      return ctx;
    }

    // Fetch the items
    const items = await knex
      .from("items_lists")
      .select(
        "items_lists.id",
        "items_lists.item_id",
        "items_lists.list_id",
        "items.name",
        "items.category_id",
        "categories.name as categoryName"
      )
      .innerJoin("items", "items.id", "items_lists.item_id")
      .innerJoin("categories", "categories.id", "items.category_id")
      .where("list_id", list.id);

    const groupedByCategories = groupByCategories(items, "categoryName");
    console.log(`Items from the route`, groupedByCategories);
    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: {
        groupedByCategories,
      },
    };
  } catch (e) {
    console.log(`E`, e);
  }
};

exports.create = async (ctx) => {
  try {
    const [list] = await knex("lists")
      .where("id", parseInt(ctx.params.listId, 10))
      .andWhere("user_id", ctx.state.user.id)
      .returning("*");
    if (!list) {
      ctx.status = 404;
      ctx.body = {
        status: "error",
        message: "List not found",
      };
      return ctx;
    }
    await itemsListsSchema.validateAsync(ctx.request.body);

    const { items } = ctx.request.body;

    const newItems = await synchronizeItems(items, list);

    console.log(`New items`, newItems);
    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: {
        items: newItems || [],
      },
    };
  } catch (e) {
    console.log(`Error while inserting items`, e);
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

const groupByCategories = (items) => {
  return items.reduce((acc, value) => {
    if (acc.length === 0) {
      acc.push({
        category: value.categoryName,
        items: [].concat(value),
      });
    } else {
      const index = acc.findIndex(
        (item) => item.category === value.categoryName
      );
      if (index !== -1) {
        acc[index].items.push(value);
      } else {
        acc.push({
          category: value.categoryName,
          items: [].concat(value),
        });
      }
    }
    return acc;
  }, []);
};
