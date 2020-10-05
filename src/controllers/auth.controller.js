const Joi = require('@hapi/joi')
const { ValidationError } = require('@hapi/joi')
const bcrypt = require('bcryptjs')
const knex = require('../db/connection')
const jsonwebtoken = require('jsonwebtoken')
const { formatValidationErrors } = require('../utils/formatValidationErrors')
const axios = require('axios')

const authSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

exports.register = async (ctx) => {
  try {
    const data = await authSchema.validateAsync(ctx.request.body)

    const hash = bcrypt.hashSync(data.password, 10)
    const [user] = await knex('users')
      .insert({
        email: data.email,
        password: hash,
      })
      .returning(['id', 'email'])

    const token = jsonwebtoken.sign(
      {
        data: user,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 days
    )

    /**
     * Add some default data to a user
     */
    try {
      // Create a bunch of default Categories
      await createDefaultCategoriesForUser(user)
      await createDefaultActiveListForUser(user)
      // Create a active default List
    } catch (e) {
      console.log('Error while inserting some default data', e)
    }

    ctx.status = 201
    ctx.body = {
      status: 'success',
      data: {
        token: token,
        user: user,
      },
    }
  } catch (e) {
    console.log(`E`, e)
    if (e instanceof ValidationError) {
      ctx.status = 422
      ctx.body = formatValidationErrors(e)
    } else if (e.code === '23505') {
      ctx.status = 422
      ctx.body = {
        status: 'error',
        field: 'email',
        message: 'This email is already taken',
      }
    } else {
      ctx.status = 500
      ctx.body = {
        status: 'error',
        message: 'An error occured',
      }
    }
  }
}

// Login a user
exports.login = async (ctx) => {
  try {
    // Validate data
    const data = await authSchema.validateAsync(ctx.request.body)
    // Check if email exists
    const user = await knex('users').where({ email: data.email }).select('*')
    if (user.length === 1) {
      isValid = await bcrypt.compare(data.password, user[0].password)
      if (!isValid) {
        ctx.status = 401
        ctx.body = {
          status: 'error',
          message: 'Invalid credentials',
        }
        return ctx
      } else {
        // Everything is good I can generate the jwt
        const userData = {
          id: user[0].id,
          email: user[0].email,
        }
        const token = jsonwebtoken.sign(
          {
            data: userData,
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' } // 7 days
          // { expiresIn: 60 }
        )
        ctx.status = 200
        ctx.body = {
          status: 'success',
          data: {
            user: userData,
            token,
          },
        }
      }
    } else {
      ctx.status = 401
      ctx.body = {
        status: 'error',
        message: 'Invalid credentials',
      }
    }
  } catch (e) {
    console.log(`Error`, e)
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

exports.githubOauth = async (ctx) => {
  // I should get the code
  // console.log('ctx from githubOauth', ctx.query.code)

  const { code } = ctx.query

  // Make a post request to get the user's infos
  // https://github.com/login/oauth/access_token
  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )
    // console.log('Res from oauth', tokenResponse.data)
    const { access_token } = tokenResponse.data

    // Get the user's informations
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`,
      },
    })

    // console.log('response', response.data)
    const { id } = response.data

    // Check if the user is already in the db
    const [user] = await knex('users').where('github_id', id)
    let newUser
    if (!user) {
      ;[newUser] = await knex('users')
        .insert({
          github_id: id,
        })
        .returning('*')

      try {
        // Create a bunch of default Categories
        await createDefaultCategoriesForUser(newUser)
        await createDefaultActiveListForUser(newUser)
        // Create a active default List
      } catch (e) {
        console.log('Error while inserting some default data', e)
      }
    }

    const token = jsonwebtoken.sign(
      {
        data: { id: user ? user.id : newUser.id },
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 days
    )

    // Need to save the user
    ctx.redirect(`${process.env.FRONTEND_URL}?access_token=${token}`)
  } catch (e) {
    console.log('Error Github Oauth', e)
    ctx.redirect(`${process.env.FRONTEND_URL}`)
  }
}

// Fetch the user's informations
exports.me = async (ctx) => {
  try {
    const user = await knex('users')
      .where({ id: ctx.state.user.id })
      .select(['id', 'email', 'created_at', 'updated_at'])

    if (user.length !== 1) {
      ctx.status = 404
      ctx.body = {
        status: 'error',
        message: 'User not found',
      }
      return ctx
    }

    ctx.status = 200
    ctx.body = {
      status: 'success',
      data: user[0],
    }
  } catch (e) {
    console.log(`E`, e)
    ctx.status = e.status || 500
    ctx.body = {
      status: 'error',
      message: 'An error occured',
    }
  }
}

const createDefaultCategoriesForUser = (user) => {
  const categories = [
    {
      name: 'Fruits and vegetables',
      user_id: user.id,
    },
    {
      name: 'Meat and fish',
      user_id: user.id,
    },
    {
      name: 'Beverages',
      user_id: user.id,
    },
  ]

  return knex('categories').insert(categories)
}

const createDefaultActiveListForUser = (user) => {
  return knex('lists').insert({
    name: 'Shopping List',
    user_id: user.id,
    status: 'active',
  })
}
