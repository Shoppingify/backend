const { chai, should, server, knex, chaiHttp } = require("./setup");
const { createUser, generateJWT, createList } = require("./utils/utils");
const { expect } = require("chai");

describe("Lists routes test", () => {
  beforeEach(() => {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest();
      })
      .then(async () => {
        await knex.seed.run({ specific: "lists_seed.js" });
        await knex.seed.run({ specific: "categories_items_seed.js" });
        return Promise.resolve();
      })
      .catch((e) => {
        console.log(`Error seeding`, e);
      });
  });

  afterEach(() => {
    return knex.migrate.rollback();
  });

  it("should fetch the user's items with their categories", (done) => {
    knex("users")
      .select(["id", "email"])
      .then((users) => {
        console.log(`User`, users[0]);
        chai
          .request(server)
          .get("/api/items")
          .set("Authorization", "Bearer " + generateJWT(users[0]))
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(200);
            res.body.status.should.equal("success");
            expect(res.body.data).to.be.an("array");

            done();
          });
      });
  });
});
