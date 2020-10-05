const bcrypt = require('bcryptjs')
const knex = require('../../db/connection')
const jsonwebtoken = require('jsonwebtoken')

exports.createUser = (email, password) => {
  const hash = bcrypt.hashSync(password, 10)
  return knex('users').returning(['id', 'email']).insert({
    email,
    password: hash,
  })
}

exports.createList = (user, name, status = 'active') => {
  console.log('UserId', user.id)
  return knex('lists').returning(['id', 'name']).insert({
    name,
    user_id: user.id,
    status,
  })
}

exports.createCategory = (user) => {
  return knex('categories').returning(['*']).insert({
    name: 'Category',
    user_id: user.id,
  })
}

exports.createItems = async (user) => {
  const [category] = await knex('categories').insert(
    {
      name: 'New Category',
      user_id: user.id,
    },
    ['*']
  )

  const [category2] = await knex('categories').insert(
    {
      name: 'Second Category',
      user_id: user.id,
    },
    ['*']
  )

  const newItems = await knex('items').insert(
    [
      {
        id: 1,
        name: 'First item',
        user_id: user.id,
        category_id: category.id,
      },
      {
        id: 2,
        name: 'Second item',
        user_id: user.id,
        category_id: category.id,
      },
      {
        id: 3,
        name: 'Third item',
        user_id: user.id,
        category_id: category2.id,
      },
      {
        id: 4,
        name: 'Fourth item',
        user_id: user.id,
        category_id: category.id,
      },
      {
        id: 5,
        name: 'Fifth item',
        user_id: user.id,
        category_id: category.id,
      },
    ],
    ['*']
  )
  return newItems
}

exports.generateJWT = (user) => {
  return jsonwebtoken.sign(
    {
      data: {
        id: user.id,
        email: user.email,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: 60 * 60 * 24 * 7 } // 7 days
    // { expiresIn: 60 }
  )
}

exports.getRandomItemInArray = (array) => {
  return array[Math.floor(Math.random() * array.length)]
}
