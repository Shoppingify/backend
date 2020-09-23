const faker = require('faker')
const { hashSync } = require('bcryptjs')
const { mtRand } = require('../../utils/mtRand')
exports.seed = async (knex) => {
  const [user] = await knex('users')
    .insert({
      email: 'stats@test.com',
      password: hashSync('password', 10),
    })
    .returning('*')

  await knex('lists').insert({ name: 'Shopping List', user_id: user.id })
  await knex('lists').insert({
    name: 'Canceled List',
    status: 'canceled',
    user_id: user.id,
  })
  await knex('lists').insert({
    name: 'Completed List',
    status: 'completed',
    user_id: user.id,
  })
  await knex('categories').insert(createCategories(user.id))
  const categories = await knex('categories')
    .where('user_id', user.id)
    .pluck('id')
  await asyncForEach(categories, async (categoryId) => {
    await knex('items').insert(createItems(categoryId, user.id))
  })

  const itemsIds = await knex('items').where('user_id', user.id).pluck('id')
  const listIds = await knex('lists')
    .where('lists.user_id', user.id)
    .pluck('id')

  await asyncForEach(listIds, async (listId) => {
    const items = addItemToList(listId, itemsIds)
    await knex('items_lists').insert(items)
  })
}

const createCategories = (userId) => {
  let categories = [
    {
      name: 'Fruits and vegetables',
      user_id: userId,
    },
    {
      name: 'Meat and fish',
      user_id: userId,
    },
    {
      name: 'Beverages',
      user_id: userId,
    },
  ]
  for (let i = 1; i < mtRand(1, 2); i++) {
    categories.push({
      name: faker.random.word(),
      user_id: userId,
    })
  }
  return categories
}

const createItems = (categoryId, userId) => {
  let items = []
  for (let i = 0; i < mtRand(30, 50); i++) {
    const item = {
      name: faker.random.word(),
      note: faker.random.words(5),
      image: faker.image.imageUrl(),
      category_id: categoryId,
      user_id: userId,
    }
    items.push(item)
  }
  return items
}

const addItemToList = (list_id, itemsIds) => {
  let items = []

  const itemsNumber = mtRand(10, 30)

  for (let i = 0; i < itemsNumber; i++) {
    const item = {
      item_id: itemsIds[i],
      list_id: list_id,
      created_at: faker.date.between('2020-01-01', '2020-12-31'),
      quantity: mtRand(1, 3),
      done: faker.random.arrayElement([true, false]),
    }
    items.push(item)
  }

  // console.log('items', items)
  return items
}

const asyncForEach = async (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array)
  }
}
