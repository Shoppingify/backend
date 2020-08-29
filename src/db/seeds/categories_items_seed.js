const faker = require("faker");

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
    for (let i = 0; i < 3; i++) {
      const category = {
        name: faker.random.word(),
        user_id: userId,
      };
      categories.push(category);
    }
  });
  await knex("categories").insert(categories);

  const categoriesIds = await knex("categories").pluck("id");

  let items = [];
  categoriesIds.forEach((catId) => {
    for (let i = 0; i < 3; i++) {
      const item = {
        name: faker.random.word(),
        note: faker.random.words(5),
        image: faker.image.imageUrl(),
        category_id: catId,
        user_id: faker.random.arrayElement(users),
      };

      items.push(item);
      // console.log(`Items`, items);
    }
  });

  await knex("items").insert(items);
  return Promise.resolve();

  // Deletes ALL existing entries
  // return knex("categories")
  //   .del()
  //   .then(function () {
  //     return knex("items").del();
  //   })
  //   .then(function () {
  //     return knex("users")
  //       .pluck("id")
  //       .then((users) => {
  //         console.log(`Users`, users);
  //         let categories = [];
  //         users.forEach((userId) => {
  //           for (let i = 0; i < 3; i++) {
  //             const category = {
  //               name: faker.random.word(),
  //               user_id: userId,
  //             };
  //             categories.push(category);
  //           }
  //         });
  //         return knex("categories").insert(categories);
  //       })
  //       .then(() => {
  //         return knex("categories")
  //           .pluck("id")
  //           .then((categories) => {
  //             console.log(`Categories`, categories);
  //             categories.forEach((catId) => {
  //               let items = [];
  //               for (let i = 0; i < 3; i++) {
  //                 const item = {
  //                   name: faker.random.word(),
  //                   note: faker.random.words(5),
  //                   image: faker.image.imageUrl(),
  //                   category_id: catId,
  //                   user_id: faker.random.arrayElement(users),
  //                 };

  //                 items.push(item);
  //                 // console.log(`Items`, items);
  //               }
  //               return knex("items")
  //                 .insert(items)
  //                 .then(() => {
  //                   console.log(`In Here`);
  //                 })
  //                 .catch((e) => {
  //                   console.log(`Error`, e);
  //                 });
  //             });
  //           });
  //       });
  //   });
};
