const { chai, should, server, knex } = require("./setup");
const {
  createUser,
  generateJWT,
  getRandomItemInArray,
  createItems,
  createList,
} = require("./utils/utils");
const { mtRand } = require("../utils/mtRand");

describe("Handle the items and list for a user", () => {
  beforeEach(() => {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest();
      })
      .then(async () => {
        // await knex.seed.run({ specific: "lists_seed.js" });
        // await knex.seed.run({ specific: "categories_items_seed.js" });
        return Promise.resolve();
      })
      .catch((e) => {
        console.log(`Error seeding`, e);
      });
  });

  afterEach(() => {
    return knex.migrate.rollback();
  });

  it("should create a new list and add some items", async () => {
    const [user] = await createUser("admin@test.fr", "password");

    const items = await createItems(user);

    const requestData = {
      name: "First list",
      items: addItemsToRequest(items),
    };

    console.log(`RequestData`, requestData);

    const res = await chai
      .request(server)
      .post("/api/lists")
      .set("Authorization", "Bearer " + generateJWT(user))
      .send(requestData);

    console.log(`res.body`, res.body);
    res.status.should.equal(201);
    res.body.data.should.include.keys("list", "items");

    const listInserted = await knex("lists").where("id", res.body.data.list.id);
    listInserted.length.should.equal(1);

    const itemsInserted = await knex("items_lists").where({
      list_id: res.body.data.list.id,
    });
    itemsInserted.length.should.equal(3);
  });

  it("should update a list and add some new items", async () => {
    const [user] = await createUser("admin@test.fr", "password");

    // Create some items
    const items = await createItems(user);
    // Create a list
    const [list] = await createList(user, "First list");

    // Add items to the list
    await knex("items_lists").insert(
      {
        item_id: items[0].id,
        list_id: list.id,
      },
      ["*"]
    );

    // Add new items to the list
    const requestData = {
      name: "First list",
      items: [
        {
          id: items[0].id,
          quantity: 1,
        },
        // New item
        {
          id: items[1].id,
          quantity: 1,
        },
      ],
    };

    const res = await chai
      .request(server)
      .put(`/api/lists/${list.id}`)
      .set("Authorization", "Bearer " + generateJWT(user))
      .send(requestData);

    res.status.should.equal(200);

    const totalItemsInLists = await knex("items_lists").where({
      list_id: list.id,
    });

    totalItemsInLists.length.should.equal(2);
  });

  it("should only update the quantity of an item", async () => {
    const [user] = await createUser("admin@test.fr", "password");

    // Create some items
    const items = await createItems(user);
    // Create a list
    const [list] = await createList(user, "First list");

    // Add items to the list
    await knex("items_lists").insert(
      {
        item_id: items[0].id,
        list_id: list.id,
      },
      ["*"]
    );

    // Add new items to the list
    const requestData = {
      name: "First list",
      items: [
        {
          id: items[0].id,
          quantity: 5,
        },
      ],
    };

    const res = await chai
      .request(server)
      .put(`/api/lists/${list.id}`)
      .set("Authorization", "Bearer " + generateJWT(user))
      .send(requestData);

    res.status.should.equal(200);

    const [item] = await knex("items_lists").where("list_id", list.id);
    item.quantity.should.equal(5);
  });

  it("should add new items to a list and remove those deleted by the user", async () => {
    const [user] = await createUser("admin@test.fr", "password");

    // Create some items
    const items = await createItems(user);
    // Create a list
    const [list] = await createList(user, "First list");

    // Add items to the list
    await knex("items_lists").insert(
      {
        item_id: items[0].id,
        list_id: list.id,
      },
      ["*"]
    );

    // Add new items to the list
    const requestData = {
      name: "First list",
      items: [
        {
          id: items[1].id,
          quantity: 2,
        },
      ],
    };

    const res = await chai
      .request(server)
      .put(`/api/lists/${list.id}`)
      .set("Authorization", "Bearer " + generateJWT(user))
      .send(requestData);

    res.status.should.equal(200);

    const newItems = await knex("items_lists").where("list_id", list.id);
    newItems.length.should.equal(1);
  });
});

const addItemsToRequest = (userItems) => {
  let items = [];
  for (let i = 0; i < 3; i++) {
    items.push({ id: userItems[i].id, quantity: mtRand(1, 5) });
  }

  return items;
};
