const knex = require("../db/connection");

exports.isOwner = async (resource, where) => {
  const res = await knex(resource).where(where).select("id");
  console.log(`Res`, res);

  return res.length === 1;
};
