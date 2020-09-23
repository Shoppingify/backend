const jsonwebtoken = require('jsonwebtoken')
const knex = require('../db/connection')

const middleware = async function jwt(ctx, next) {
  //Grab the token
  const token = getJwtToken(ctx)
  try {
    //Try and decode the token asynchronously
    const decoded = await jsonwebtoken.verify(token, process.env.JWT_SECRET)

    console.log(`Decoded`, decoded)

    const [user] = await knex('users').where('id', decoded.data.id)

    if (!user) {
      ctx.status = 401
      ctx.body = {
        status: 'error',
        message: 'This user does not exists',
      }
      return ctx
    }
    //If it worked set the ctx.state.user parameter to the decoded token.
    ctx.state.user = decoded.data
  } catch (error) {
    //If it's an expiration error, let's report that specifically.
    if (error.name === 'TokenExpiredError') {
      ctx.status = 401
      ctx.body = {
        status: 'error',
        message: 'Token expired',
      }
      return ctx
    } else {
      ctx.status = 401
      ctx.body = {
        status: 'error',
        message: 'Invalid token',
      }
      return ctx
    }
  }

  return next()
}

function getJwtToken(ctx) {
  if (!ctx.header || !ctx.header.authorization) {
    return
  }

  const parts = ctx.header.authorization.split(' ')

  if (parts.length === 2) {
    const scheme = parts[0]
    const credentials = parts[1]

    if (/^Bearer$/i.test(scheme)) {
      return credentials
    }
  }
  ctx.status = 401
  ctx.body = {
    status: 'error',
    message: 'Unauthorized',
  }
  return ctx
}

module.exports = middleware
