const { queryBuilder } = require('../db/connection')
const knex = require('../db/connection')

exports.index = async (ctx) => {
  // Should I use a queryParams to change from month to year?

  const monthlyItems = await queryStats(ctx, 'items', 'monthly')
  const monthlyCategories = await queryStats(ctx, 'categories', 'monthly')

  console.log('monthlyItems', monthlyItems)

  const [monthlyTotal] = await knex('items_lists')
    .innerJoin('items', 'items.id', 'items_lists.item_id')
    .innerJoin('lists', 'lists.id', 'items_lists.list_id')
    .where('lists.user_id', ctx.state.user.id)
    .sum('items_lists.quantity as total')

  const monthlyItemStats = monthlyItems.map((item) => {
    const percent = Math.floor((item.quantity / monthlyTotal.total) * 100)
    return {
      name: item.name,
      percent,
    }
  })

  const monthlyCategoriesStats = monthlyCategories.map((cat) => {
    const percent = Math.floor((cat.quantity / monthlyTotal.total) * 100)
    return {
      name: cat.name,
      percent,
    }
  })

  const quantityByDay = await quantityBy(ctx, 'day', 'monthly')

  const quantityByMonth = await quantityBy(ctx, 'month', 'yearly')

  console.log('montlyTotalItems', monthlyTotal)

  ctx.status = 200
  ctx.body = {
    status: 'success',
    data: {
      monthlyItemStats,
      monthlyCategoriesStats,
      quantityByDay,
      quantityByMonth,
    },
  }
}

/**
 * @params {Context} ctx
 * @param {string} type ('items', 'categories')
 * @param {string} interval ('monthly', 'yearly')
 */
const queryStats = async (ctx, type, interval) => {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  let queryBuilder = knex('items_lists').innerJoin(
    'items',
    'items.id',
    'items_lists.item_id'
  )

  if (type === 'items') {
    queryBuilder
      .innerJoin('lists', 'lists.id', 'items_lists.list_id')
      .where('lists.user_id', ctx.state.user.id)
  } else if (type === 'categories') {
    queryBuilder
      .innerJoin('categories', 'categories.id', 'items.category_id')
      .where('categories.user_id', ctx.state.user.id)
  }
  // return await knex('items_lists')

  if (interval === 'monthly') {
    queryBuilder.andWhereRaw(
      `date_part('month', items_lists.created_at) >= ${currentMonth} AND date_part('month', items_lists.created_at) < ${
        currentMonth + 1
      }`
    )
  } else if (interval === 'yearly') {
    queryBuilder.andWhereRaw(
      `date_part('year', items_lists.created_at) >= ${currentYear} AND date_part('year', items_lists.created_at) < ${
        currentYear + 1
      }`
    )
  }

  return queryBuilder
    .sum('items_lists.quantity as quantity')
    .select(`${type}.name`)
    .groupBy(`${type}.name`)
    .orderBy('quantity', 'desc')
    .limit(3)
}

/**
 *
 * @param {Context} ctx
 * @param {string} quantityBy (['day', 'month'])
 * @param {string} interval (['monthly', 'yearly'])
 */
const quantityBy = async (ctx, quantityBy, interval) => {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  let queryBuilder = knex('items_lists')
    .innerJoin('lists', 'lists.id', 'items_lists.list_id')
    .sum('items_lists.quantity as quantity')
    .select(
      knex.raw(`date_part('${quantityBy}', items_lists.created_at) as date`)
    )
    .where('lists.user_id', ctx.state.user.id)

  if (interval === 'monthly') {
    queryBuilder.andWhereRaw(
      `date_part('month', items_lists.created_at) >= ${currentMonth} AND date_part('month', items_lists.created_at) < ${
        currentMonth + 1
      }`
    )
  } else if (interval === 'yearly') {
    queryBuilder.andWhereRaw(
      `date_part('year', items_lists.created_at) >= ${currentYear} AND date_part('year', items_lists.created_at) < ${
        currentYear + 1
      }`
    )
  }

  queryBuilder.groupBy('date')
  console.log('querySql', queryBuilder.toSQL())
  return queryBuilder
}
