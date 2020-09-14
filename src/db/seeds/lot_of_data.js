const { mtRand } = require('../../utils/mtRand')
const faker = require('faker')
const { hashSync } = require('bcryptjs')

exports.seed = async (knex) => {
  await knex('users').del()
  await knex('categories').del()
  await knex('lists').del()
  await knex('items').del()
  await knex('items_lists').del()

  const [user] = await knex('users')
    .insert({
      email: 'data@test.com',
      password: hashSync('password', 10),
    })
    .returning('*')

  console.log('user')
  await knex('lists').insert({ name: 'Shopping List', user_id: user.id })
  await knex('categories').insert(createCategories(user.id))

  // User categories
  const categories = await knex('categories')
    .where('user_id', user.id)
    .pluck('id')
  await asyncForEach(categories, async (categoryId) => {
    await knex('items').insert(createItems(categoryId, user.id))
  })
}

const createUsers = () => {
  let users = []
  for (let i = 1; i < 10; i++) {
    const user = {
      email: faker.internet.email(),
      password: hashSync('password', 10),
    }
    users.push(user)
  }

  return users
}

const createRandomNotActiveList = (userId) => {
  let lists = []
  for (let i = 1; i < mtRand(3, 10); i++) {
    lists.push({
      name: faker.random.word(),
      user_id: userId,
      status: faker.random.arrayElement(['completed', 'canceled']),
    })
  }
  return lists
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
  for (let i = 1; i < mtRand(10, 20); i++) {
    categories.push({
      name: faker.random.word(),
      user_id: userId,
    })
  }
  return categories
}

const createItems = (categoryId, userId) => {
  let items = []
  for (let i = 0; i < mtRand(40, 60); i++) {
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

const addItemToList = (listId, items) => {
  let itemsToAdd = []
  for (let i = 0; i < mtRand(5, 10); i++) {
    if (i < items.length) {
      itemsToAdd.push({
        list_id: listId,
        item_id: items[i],
        done: faker.random.arrayElement([true, false]),
        quantity: mtRand(1, 5),
      })
    }
  }
  return itemsToAdd
}

const asyncForEach = async (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array)
  }
}
