const knex = require('../db/connection')
const Joi = require('@hapi/joi')
const { ValidationError } = require('@hapi/joi')
const { formatValidationErrors } = require('../utils/formatValidationErrors')

const createItemSchema = Joi.object().keys({
  name: Joi.string().trim().required(),
  note: Joi.string().optional().allow('').trim(),
  image: Joi.string().optional().allow('').trim().uri(),
  category: Joi.string().trim().required(),
})

const updateItemSchema = Joi.object().keys({
  name: Joi.string().trim(),
  note: Joi.string().optional().allow('').trim(),
  image: Joi.string().optional().allow('').trim().uri(),
  category: Joi.string().trim(),
})

// Fetch the items grouped by categories
exports.index = async (ctx) => {
  // Maybe I should add some pagination on the items

  try {
    const categories = await knex('categories')
      .where({
        user_id: null,
      })
      .orWhere({ user_id: ctx.state.user.id })
      .select('*')

    const items = await knex('items')
      .innerJoin('categories', 'items.category_id', '=', 'categories.id')
      .where({
        'items.user_id': ctx.state.user.id,
      })
      .select('items.*', 'categories.name as categoryName')

    let results = []
    categories.forEach((cat) => {
      results.push({
        category_id: cat.id,
        category: cat.name,
        items: [],
      })
      items.forEach((item) => {
        if (item.category_id === cat.id) {
          const index = results.findIndex((r) => r.category === cat.name)
          if (index !== -1) {
            results[index].items.push(item)
          }
        }
      })
    })

    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: results,
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

// Create an item
exports.create = async (ctx) => {
  try {
    await createItemSchema.validateAsync(ctx.request.body)

    const { name, note, image, category } = ctx.request.body

    // Check if the category exists
    const cat = await knex('categories')
      // .where("user_id", ctx.state.user.id)
      // .orWhere("user_id", null)
      .whereRaw('(user_id IS NULL OR user_id = ?)', [ctx.state.user.id])
      .andWhere('name', 'ILIKE', `%${category}%`)
      .select('id', 'name')

    if (cat.length === 1) {
      // The category exists so I just need to insert the item
      const [newItem] = await knex('items')
        .returning('*')
        .insert({
          name,
          note: note || '',
          image: image || '',
          category_id: cat[0].id,
          user_id: ctx.state.user.id,
        })

      newItem['categoryName'] = cat[0].name

      // add the categoryName to the item

      ctx.status = 201
      ctx.body = {
        status: 'success',
        data: newItem,
      }
    } else {
      // Create a new Category
      const newCategory = await knex('categories').returning('*').insert({
        name: category,
        user_id: ctx.state.user.id,
      })

      // Create a new Item with the new category associated
      const [newItem] = await knex('items')
        .returning('*')
        .insert({
          name,
          note: note || '',
          image: image || '',
          category_id: newCategory[0].id,
          user_id: ctx.state.user.id,
        })

      // Add the categoryName to the item
      newItem['categoryName'] = newCategory[0].name

      ctx.status = 201
      ctx.body = {
        status: 'success',
        data: newItem,
      }
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
  }
}

// Update an item
exports.update = async (ctx) => {
  const { id } = ctx.params

  try {
    // fetch the item
    const item = await knex('items')
      .where('id', id)
      .andWhere('user_id', ctx.state.user.id)
      .select('id')
    if (item.length !== 1) {
      ctx.status = 404
      ctx.body = {
        status: 'error',
        message: 'Item not found',
      }
      return ctx
    }

    await updateItemSchema.validateAsync(ctx.request.body)

    const { name, note, image, category } = ctx.request.body

    // Check if the category exists
    const cat = await knex('categories')
      // .where("user_id", ctx.state.user.id)
      // .orWhere("user_id", null)
      .whereRaw('(user_id IS NULL OR user_id = ?)', [ctx.state.user.id])
      .andWhere('name', 'ILIKE', `%${category}%`)
      .select('id', 'name')

    if (cat.length === 1) {
      // The category exists so I just need to insert the item
      const [newItem] = await knex('items')
        .where('id', id)
        .update(
          {
            name,
            note: note || '',
            image: image || '',
            category_id: cat[0].id,
            user_id: ctx.state.user.id,
          },
          ['*']
        )

      // Add the categoryName to the item
      newItem['categoryName'] = cat[0].name

      ctx.status = 200
      ctx.body = {
        status: 'success',
        data: newItem,
      }
    } else {
      // Create a new Category
      const newCategory = await knex('categories').returning('*').insert({
        name: category,
        user_id: ctx.state.user.id,
      })

      // Create a new Item with the new category associated
      const [newItem] = await knex('items')
        .where('id', id)
        .update(
          {
            name,
            note: note || '',
            image: image || '',
            category_id: newCategory[0].id,
            user_id: ctx.state.user.id,
          },
          ['*']
        )

      // Add the categoryName to the item
      newItem['categoryName'] = newCategory[0].name

      ctx.status = 200
      ctx.body = {
        status: 'success',
        data: newItem,
      }
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
  }
}

exports.delete = async (ctx) => {
  const { id } = ctx.params
  // console.log(`id`, id);
  try {
    await knex('items')
      .where('id', id)
      .andWhere('user_id', ctx.state.user.id)
      .del()

    ctx.status = 204
  } catch (e) {
    console.log(`E`, e)
    ctx.status = e.status || 500
    ctx.message = 'An error occured'
  }
}
