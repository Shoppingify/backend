const { isOwner } = require('../utils/isOwner')
const knex = require('../db/connection')
const Joi = require('@hapi/joi')
const { ValidationError } = require('@hapi/joi')
const { formatValidationErrors } = require('../utils/formatValidationErrors')

const listSchema = Joi.object().keys({
  name: Joi.string().min(3).trim().required(),
})

const listUpdateSchema = Joi.object().keys({
  name: Joi.string().min(3).trim(),
  status: Joi.string().valid('active', 'completed', 'canceled'),
})

const authorizedFilter = ['status']

exports.index = async (ctx) => {
  // Check if we have filters
  const params = ctx.query
  let filters = []
  for (const prop in ctx.query) {
    if (authorizedFilter.includes(prop)) {
      filters.push({
        filter: prop,
        value: params[prop],
      })
    }
  }
  console.log(`filters`, filters)
  // Fetch the lists
  try {
    const queryBuilder = knex('lists').where({
      user_id: ctx.state.user.id,
    })

    filters.forEach((el) => {
      queryBuilder.andWhere(el.filter, el.value)
    })

    const lists = await queryBuilder.select('*')

    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: lists,
    }
  } catch (e) {
    console.log(`Er`, e)
    ctx.status = e.status || 500
    ctx.body = {
      status: 'error',
      message: 'An error occured',
    }
  }
}

exports.show = async (ctx) => {
  try {
    const list = await knex('lists').where({
      id: parseInt(ctx.params.id, 10),
      user_id: ctx.state.user.id,
    })

    if (list.length === 0) {
      ctx.status = 404
      ctx.body = {
        status: 'error',
        message: 'List not found',
      }
      return ctx
    }

    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: list[0],
    }
  } catch (e) {
    console.log(`Error`, e)
    ctx.status = e.status || 500
    ctx.body = {
      status: 'error',
      message: 'An error occured',
    }
  }
}

exports.create = async (ctx) => {
  try {
    await listSchema.validateAsync(ctx.request.body)

    // Check if the user already have an active list
    const activeLists = await knex('lists')
      .where('user_id', ctx.state.user.id)
      .andWhere('status', 'active')
    if (activeLists.length > 0) {
      ctx.status = 400
      ctx.body = {
        status: 'error',
        message: 'You can only have on active list at a time',
      }
      return ctx
    }

    const { name } = ctx.request.body

    const [list] = await knex('lists').returning('*').insert({
      name,
      user_id: ctx.state.user.id,
    })

    ctx.status = 201
    ctx.body = {
      status: 'success',
      data: {
        list,
      },
    }
  } catch (e) {
    console.log(`E`, e)
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
    console.log(`Error`, e)
  }
}

exports.update = async (ctx) => {
  const { name, status } = ctx.request.body
  if (!name && !status) {
    ctx.status = 400
    ctx.body = {
      status: 'error',
      message: 'Name or status are missing',
    }
    return ctx
  }
  try {
    // Fetch the list
    const [list] = await knex('lists').where({
      id: parseInt(ctx.params.id, 10),
      user_id: ctx.state.user.id,
    })

    if (!list) {
      ctx.status = 404
      ctx.body = {
        status: 'error',
        message: 'List not found',
      }
      return ctx
    }
    await listUpdateSchema.validateAsync(ctx.request.body)

    const [updatedList] = await knex('lists')
      .where({ id: list.id })
      .update(
        {
          name,
          status: status ? status : list.status,
          user_id: ctx.state.user.id,
        },
        ['id', 'name', 'user_id']
      )
    console.log(`Updated list`, updatedList)

    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: {
        list: updatedList,
      },
    }
  } catch (e) {
    if (e instanceof ValidationError) {
      ctx.status = 422
      ctx.body = await formatValidationErrors(e)
    } else {
      ctx.status = e.status || 500
      ctx.body = {
        status: 'error',
        message: 'An error occured',
      }
    }
    console.log(`Error`, e)
  }
}

// Delete a list
exports.delete = async (ctx) => {
  try {
    const list = await knex('lists').where({
      id: parseInt(ctx.params.id, 10),
      user_id: ctx.state.user.id,
    })

    if (list.length !== 1) {
      ctx.status = 404
      ctx.body = {
        status: 'error',
        message: 'List not found',
      }
    }

    await knex('lists').where({ id: list[0].id }).del()
    ctx.status = 204
  } catch (e) {
    console.log(`Error`, e)
    ctx.status = e.status || 500
    ctx.body = {
      status: 'error',
      message: 'An error occured',
    }
  }
}
