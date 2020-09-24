const { QueryBuilder } = require('knex')
const knex = require('../db/connection')

exports.index = async (ctx) => {
  //Fetch the stats for a month
  let itemsByMonth = await queryStats(ctx, 'items', 'monthly')
  let categoriesByMonth = await queryStats(ctx, 'categories', 'monthly')

  const [{ total: monthlyTotal }] = await fetchTotal(ctx, 'monthly')

  calcPercent(itemsByMonth, monthlyTotal)
  calcPercent(categoriesByMonth, monthlyTotal)

  const quantityByDay = await quantityBy(ctx, 'day', 'monthly')

  //Fetch the stats for a year
  let itemsByYear = await queryStats(ctx, 'items', 'yearly')
  let categoriesByYear = await queryStats(ctx, 'categories', 'yearly')

  const [{ total: yearlyTotal }] = await fetchTotal(ctx, 'yearly')

  calcPercent(itemsByYear, yearlyTotal)
  calcPercent(itemsByYear, yearlyTotal)

  const quantityByMonth = await quantityBy(ctx, 'month', 'yearly')

  ctx.status = 200
  ctx.body = {
    status: 'success',
    data: {
      month: {
        itemsByMonth,
        categoriesByMonth,
        quantityByDay,
      },
      year: {
        itemsByYear,
        categoriesByYear,
        quantityByMonth,
      },
    },
  }
}

/**
 * Fetch the most added items/categories for an interval
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
 * Fetch the quantity by Day or Month to create the data for the graph
 * @param {Context} ctx
 * @param {string} quantityBy (['day', 'month'])
 * @param {string} interval (['monthly', 'yearly'])
 * @returns {QueryBuilder}
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
  return queryBuilder
}

/**
 * Fetch the total of quantity in a given interval
 * @param {Context} ctx
 * @param {string} interval (['monthly', 'yearly'])
 * @returns {QueryBuilder}
 */
const fetchTotal = (ctx, interval) => {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  let queryBuilder = knex('items_lists')
    .innerJoin('items', 'items.id', 'items_lists.item_id')
    .innerJoin('lists', 'lists.id', 'items_lists.list_id')
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
  return queryBuilder.sum('items_lists.quantity as total')
}

/**
 * Map through the data and transform the quantity in percentage
 * @param {array} data
 * @param {number} total
 * @returns {array}
 */
const calcPercent = (data, total) => {
  return data.map((el) => {
    const percent = Math.floor((el.quantity / total) * 100)
    return {
      name: el.name,
      percent,
    }
  })
}
