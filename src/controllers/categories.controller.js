const { ValidationError } = require('@hapi/joi')
const Joi = require('@hapi/joi')
const knex = require('../db/connection')
const { formatValidationErrors } = require('../utils/formatValidationErrors')

const categoryUpdateSchema = Joi.object().keys({
  name: Joi.string().min(2).required(),
})

exports.index = async (ctx) => {
  try {
    const categories = await knex('categories')
      .where('user_id', ctx.state.user.id)
      .andWhere('deleted_at', null)

    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: categories,
    }
  } catch (e) {
    ctx.status = e.status || 500
    ctx.body = {
      status: 'error',
      message: e.message,
    }
    console.log(`Error`, e)
  }
}

exports.update = async (ctx) => {
  try {
    await categoryUpdateSchema.validateAsync(ctx.request.body)

    const { name } = ctx.request.body

    const [category] = await knex('categories')
      .where('id', ctx.params.id)
      .andWhere('user_id', ctx.state.user.id)
      .andWhere('deleted_at', null)

    if (!category) {
      ctx.status = 404
      ctx.body = {
        status: 'error',
        message: 'Category not found',
      }
      return ctx
    }

    //Check if the user has already a category with this name
    const [categoryExists] = await knex('categories')
      .where('user_id', ctx.state.user.id)
      .andWhereRaw('LOWER(name) = ?', name.toLowerCase())

    if (categoryExists) {
      ctx.status = 422
      ctx.body = {
        status: 'error',
        field: 'name',
        message: 'You already have a category with this name',
      }
      return ctx
    }

    const [updatedCategory] = await knex('categories')
      .where('id', ctx.params.id)
      .andWhere('user_id', ctx.state.user.id)
      .update({ name }, ['*'])

    console.log(`updatedCategory`, updatedCategory)

    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: updatedCategory,
    }
  } catch (e) {
    console.log(`Error updating category`, e)
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
  try {
    const { id } = ctx.params

    const [category] = await knex('categories')
      .where('id', id)
      .andWhere('user_id', ctx.state.user.id)

    if (!category) {
      ctx.status = 404
      ctx.body = {
        status: 'error',
        message: 'Category not found',
      }
      return ctx
    }

    // Fetch all items from that category
    const itemsIds = await knex('items')
      .where('category_id', id)
      .andWhere('deleted_at', null)
      .pluck('id')
    //create a transaction to set the deleted_at column to the category and the items

    await knex.transaction(async (trx) => {
      await trx('categories')
        .where('id', id)
        .andWhere('user_id', ctx.state.user.id)
        .update({ deleted_at: knex.fn.now() })

      await trx('items')
        .whereIn('id', itemsIds)
        .update({ deleted_at: knex.fn.now() })
    })

    ctx.status = 204
  } catch (e) {
    console.log(`Error updating category`, e)
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
