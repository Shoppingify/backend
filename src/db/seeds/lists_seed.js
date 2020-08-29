const { hashSync } = require("bcryptjs");
const faker = require("faker");

const createUsers = () => {
  let users = [];
  for (let i = 1; i < 10; i++) {
    const user = {
      email: faker.internet.email(),
      password: hashSync("password", 10),
    };
    users.push(user);
  }

  return users;
};

exports.seed = function (knex) {
  // Deletes ALL existing entries

  return knex("users")
    .del()
    .then(() => {
      return knex("users").insert(createUsers());
    })
    .then(() => {
      return knex("users")
        .pluck("id")
        .then((userIds) => {
          // console.log(`Usersids`, userIds);
          let lists = [];

          userIds.forEach((id) => {
            for (let i = 0; i < 5; i++) {
              const list = {
                name: faker.lorem.word(),
                user_id: id,
              };
              // console.log(`list`, list);
              lists.push(list);
            }
          });

          return knex("lists").insert(lists);
        });
    });
};
