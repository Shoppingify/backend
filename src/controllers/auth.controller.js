const Joi = require("@hapi/joi");
const { ValidationError } = require("@hapi/joi");
const bcrypt = require("bcryptjs");
const knex = require("../db/connection");
const jsonwebtoken = require("jsonwebtoken");
const { formatValidationErrors } = require("../utils/formatValidationErrors");

const authSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

exports.register = async (ctx) => {
  try {
    const data = await authSchema.validateAsync(ctx.request.body);

    const hash = bcrypt.hashSync(data.password, 10);
    const user = await knex("users")
      .insert({
        email: data.email,
        password: hash,
      })
      .returning(["id", "email"]);

    ctx.status = 201;
    ctx.body = {
      status: "success",
      data: user[0],
    };
  } catch (e) {
    console.log(`E`, e);
    if (e instanceof ValidationError) {
      ctx.status = 422;
      ctx.body = formatValidationErrors(e);
    } else if (e.code === "23505") {
      ctx.status = 422;
      ctx.body = {
        status: "error",
        field: "email",
        message: "This email is already taken",
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        status: "error",
        message: "An error occured",
      };
    }
  }
};

exports.login = async (ctx) => {
  try {
    // Validate data
    const data = await authSchema.validateAsync(ctx.request.body);
    // Check if email exists
    const user = await knex("users").where({ email: data.email }).select("*");
    if (user.length === 1) {
      isValid = await bcrypt.compare(data.password, user[0].password);
      if (!isValid) {
        ctx.status = 401;
        ctx.body = {
          status: "error",
          message: "Invalid credentials",
        };
      } else {
        // Everything is good I can generate the jwt
        const userData = {
          id: user[0].id,
          email: user[0].email,
        };
        const token = jsonwebtoken.sign(
          {
            data: userData,
          },
          process.env.JWT_SECRET,
          { expiresIn: 60 * 60 * 24 * 7 } // 7 days
          // { expiresIn: 60 }
        );
        ctx.status = 200;
        ctx.body = {
          status: "success",
          data: {
            user: userData,
            token,
          },
        };
      }
    } else {
      ctx.status = 401;
      ctx.body = {
        status: "error",
        message: "Invalid credentials",
      };
    }
    // Compare password
  } catch (e) {
    console.log(`Error`, e);
    if (e instanceof ValidationError) {
      ctx.status = 422;
      ctx.body = formatValidationErrors(e);
    } else {
      ctx.body = {
        status: "error",
        message: "An error occured",
      };
    }
  }
};
