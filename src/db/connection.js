const environment = process.env.NODE_ENV || "development";
const config = require("../../knexfile")[environment.trim()];
// console.log(`Config`, config);
module.exports = require("knex")(config);
