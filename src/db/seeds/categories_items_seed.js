const faker = require("faker");
const { mtRand } = require("../../utils/mtRand");

exports.seed = async function (knex) {
  await knex("categories").del();
  await knex("items").del();

  // Add Basic categories
  await knex("categories").insert([
    { name: "Fruits and vegetables" },
    { name: "Meat and fish" },
    { name: "Beverages" },
  ]);

  const users = await knex("users").pluck("id");
  let categories = [];
  users.forEach((userId) => {
    for (let i = 0; i < mtRand(3, 5); i++) {
      const category = {
        name: faker.random.word(),
        user_id: userId,
      };
      categories.push(category);
    }
  });
  await knex("categories").insert(categories);

  const categoriesIds = await knex("categories").pluck("id");

  const usersIds = await knex("users").pluck("id");

  let items = [];
  usersIds.forEach((userId) => {
    categoriesIds.forEach((catId) => {
      for (let i = 0; i < mtRand(2, 6); i++) {
        const item = {
          name: faker.random.word(),
          note: faker.random.words(5),
          image: faker.image.imageUrl(),
          category_id: catId,
          user_id: userId,
        };

        items.push(item);

        // console.log(`Items`, items);
      }
    });
  });

  await knex("items").insert(items);
  return Promise.resolve();
};
