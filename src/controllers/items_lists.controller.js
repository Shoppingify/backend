const knex = require('../db/connection')
const Joi = require('@hapi/joi')
const { ValidationError } = require('@hapi/joi')
const { formatValidationErrors } = require('../utils/formatValidationErrors')

const itemCreateSchema = Joi.object().keys({
  item_id: Joi.number().required(),
  list_id: Joi.number().required(),
  quantity: Joi.number(),
})

const itemUpdateSchema = Joi.object().keys({
  item_id: Joi.number().required(),
  list_id: Joi.number().required(),
  quantity: Joi.number().required(),
  done: Joi.boolean(),
})

const itemDeleteSchema = Joi.object().keys({
  item_id: Joi.number().required(),
  list_id: Joi.number().required(),
})

exports.index = async (ctx) => {
  try {
    const [list] = await knex('lists')
      .where('id', parseInt(ctx.params.listId, 10))
      .andWhere('user_id', ctx.state.user.id)
    if (!list) {
      ctx.status = 404
      ctx.body = {
        status: 'error',
        message: 'List not found',
      }
      return ctx
    }

    // Fetch the items
    const items = await knex
      .from('items_lists')
      .select(
        // 'items_lists.id',
        'items_lists.item_id as id',
        'items_lists.list_id',
        'items_lists.done',
        'items_lists.quantity',
        'items.name',
        'items.category_id',
        'categories.name as categoryName'
      )
      .innerJoin('items', 'items.id', 'items_lists.item_id')
      .innerJoin('categories', 'categories.id', 'items.category_id')
      .where('list_id', list.id)

    const groupedByCategories = groupByCategories(items, 'categoryName')
    console.log(`Items from the route`, groupedByCategories)
    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: {
        items: groupedByCategories,
      },
    }
  } catch (e) {
    console.log(`E`, e)
  }
}

exports.create = async (ctx) => {
  try {
    await itemCreateSchema.validateAsync(ctx.request.body)

    const { item_id, list_id, quantity } = ctx.request.body

    const [list] = await knex('lists')
      .where('id', list_id)
      .andWhere('user_id', ctx.state.user.id)

    const [item] = await knex('items')
      .where('id', item_id)
      .andWhere('user_id', ctx.state.user.id)

    if (!list || !item) {
      ctx.status = 400
      ctx.body = {
        status: 'error',
        message: 'Invalid request... The list or the item does not exists',
      }
      return ctx
    }

    if (list.status !== 'active') {
      ctx.status = 400
      ctx.body = {
        status: 'error',
        message:
          "You cannot add an item to a list if its status is not 'active'",
      }
      return ctx
    }

    const [insertedItem] = await knex('items_lists').returning('*').insert({
      item_id,
      list_id,
      quantity,
    })

    ctx.status = 201
    ctx.body = {
      status: 'success',
      data: insertedItem,
    }
  } catch (e) {
    console.log('Create error', e)
    if (e instanceof ValidationError) {
      ctx.status = 422
      ctx.body = formatValidationErrors(e)
    } else {
      ctx.status = e.status || 500
      ctx.body = {
        status: 'error',
        message: 'An error occured',
      }
    }
  }
}

exports.update = async (ctx) => {
  try {
    await itemUpdateSchema.validateAsync(ctx.request.body)

    const { item_id, list_id, quantity, done } = ctx.request.body

    const [list] = await knex('lists')
      .where('id', list_id)
      .andWhere('user_id', ctx.state.user.id)

    const [item] = await knex('items')
      .where('id', item_id)
      .andWhere('user_id', ctx.state.user.id)

    if (!list || !item) {
      ctx.status = 400
      ctx.body = {
        status: 'error',
        message: 'Invalid request... The list or the item does not exists',
      }
      return ctx
    }

    // You could only update the quantity if the list status is active and done is false
    if (list.status !== 'active' && done && done === false) {
      ctx.status = 400
      ctx.body = {
        status: 'error',
        message:
          "You cannot update an item to a list if its status is not 'active'",
      }
      return ctx
    }

    const [updatedItem] = await knex('items_lists')
      .where('item_id', item_id)
      .andWhere('list_id', list_id)
      .update(
        {
          quantity,
          done,
        },
        ['*']
      )

    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: updatedItem,
    }
  } catch (e) {
    console.log('Update error', e)
    if (e instanceof ValidationError) {
      ctx.status = 422
      ctx.body = formatValidationErrors(e)
    } else {
      ctx.status = e.status || 500
      ctx.body = {
        status: 'error',
        message: 'An error occured',
      }
    }
  }
}

exports.delete = async (ctx) => {
  console.log(`ctx request`, ctx.request.body)
  try {
    await itemDeleteSchema.validateAsync(ctx.request.body)

    const { item_id, list_id } = ctx.request.body

    const [list] = await knex('lists')
      .where('id', list_id)
      .andWhere('user_id', ctx.state.user.id)

    const [item] = await knex('items')
      .where('id', item_id)
      .andWhere('user_id', ctx.state.user.id)

    if (!list || !item) {
      ctx.status = 400
      ctx.body = {
        status: 'error',
        message: 'Invalid request... The list or the item does not exists',
      }
      return ctx
    }

    if (list.status !== 'active') {
      ctx.status = 400
      ctx.body = {
        status: 'error',
        message:
          "You cannot delete an item from a list if its status is not 'active'",
      }
      return ctx
    }

    // Delete the item
    await knex('items_lists')
      .where('item_id', item_id)
      .andWhere('list_id', list_id)
      .delete()

    ctx.status = 204
  } catch (e) {
    console.log('Delete error', e)
    if (e instanceof ValidationError) {
      ctx.status = 422
      ctx.body = formatValidationErrors(e)
    } else {
      ctx.status = e.status || 500
      ctx.body = {
        status: 'error',
        message: 'An error occured',
      }
    }
  }
}

const groupByCategories = (items) => {
  return items.reduce((acc, value) => {
    if (acc.length === 0) {
      acc.push({
        category: value.categoryName,
        items: [].concat(value),
      })
    } else {
      const index = acc.findIndex(
        (item) => item.category === value.categoryName
      )
      if (index !== -1) {
        acc[index].items.push(value)
      } else {
        acc.push({
          category: value.categoryName,
          items: [].concat(value),
        })
      }
    }
    return acc
  }, [])
}
