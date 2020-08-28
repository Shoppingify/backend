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

exports.generateJWT = (userData) => {
  console.log(`userData`, userData);
  return jsonwebtoken.sign(
    {
      data: userData,
    },
    process.env.JWT_SECRET,
    { expiresIn: 60 * 60 * 24 * 7 } // 7 days
    // { expiresIn: 60 }
  );
};
