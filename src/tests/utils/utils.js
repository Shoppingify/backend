const bcrypt = require("bcryptjs");
const knex = require("../../db/connection");
const jsonwebtoken = require("jsonwebtoken");

exports.createUser = (email, password) => {
  const hash = bcrypt.hashSync(password, 10);
  return knex("users").returning(["id", "email"]).insert({
    email,
    password: hash,
  });
};

exports.createList = (user, name) => {
  console.log("UserId", user.id);
  return knex("lists").returning(["id", "name"]).insert({
    name,
    user_id: user.id,
  });
};

exports.generateJWT = (user) => {
  console.log(`user`, user);
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
  );
};
