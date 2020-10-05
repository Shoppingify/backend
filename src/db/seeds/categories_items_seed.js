const faker = require('faker')
const { mtRand } = require('../../utils/mtRand')

exports.seed = async function (knex) {
  await knex('categories').del()
  await knex('items').del()

  // Add Basic categories
  await knex('categories').insert([
    { name: 'Fruits and vegetables' },
    { name: 'Meat and fish' },
    { name: 'Beverages' },
  ])

  const users = await knex('users').pluck('id')
  let categories = []
  let lists = []
  users.forEach((userId) => {
    for (let i = 0; i < mtRand(3, 5); i++) {
      const category = {
        name: faker.random.word(),
        user_id: userId,
      }

      const list = {
        name: faker.random.word(),
        user_id: userId,
        status: faker.random.arrayElement(['active', 'completed', 'canceled']),
      }

      categories.push(category)
      lists.push(list)
    }
  })
  await knex('categories').insert(categories)
  await knex('lists').insert(lists)

  const categoriesIds = await knex('categories').pluck('id')

  const usersIds = await knex('users').pluck('id')

  let items = []
  usersIds.forEach((userId) => {
    categoriesIds.forEach((catId) => {
      for (let i = 0; i < mtRand(2, 6); i++) {
        const item = {
          name: faker.random.word(),
          note: faker.random.words(5),
          image: faker.image.imageUrl(),
          category_id: catId,
          user_id: userId,
        }

        items.push(item)

        //
      }
    })
  })

  await knex('items').insert(items)

  const firstUser = await knex('users').first()
  const firstUserFirstList = await knex('lists')
    .where('user_id', firstUser.id)
    .first()
  const firstUserItems = await knex('items').where('user_id', firstUser.id)

  let itemsToInsert = []
  for (let i = 0; i < mtRand(10, 15); i++) {
    itemsToInsert.push({
      list_id: firstUserFirstList.id,
      item_id: firstUserItems[i].id,
      quantity: mtRand(2, 5),
      done: faker.random.arrayElement([true, false]),
    })
  }

  await knex('items_lists').insert(itemsToInsert)
  return Promise.resolve()
}
