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
      .orWhere('user_id', null)

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

    if (!category) {
      ctx.status = 400
      ctx.body = {
        status: 'error',
        message: 'Category not found',
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
