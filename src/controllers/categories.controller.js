const knex = require('../db/connection')

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
