const { chai, should, server, knex, chaiHttp } = require("./setup");
const { createUser, generateJWT } = require("./utils/utils");

describe("Lists routes test", () => {
  beforeEach(() => {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest();
      })
      .then(() => {
        return knex.seed.run();
      });
  });

  afterEach(() => {
    return knex.migrate.rollback();
  });

  it("should not authorize anonymous user to see lists", (done) => {
    createUser("admin@test.fr", "password")
      .then((value) => {
        console.log(`VAlue `, value);
        chai
          .request(server)
          .get(`/api/lists/${value.id}`)
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(401);
            done();
          });
      })
      .catch((e) => {
        console.log(`Error`, e);
        // done();
      });
  });

  it("should authorize user to see his lists", (done) => {
    const user1 = createUser("admin@test.fr", "password");
    const user2 = createUser("other@test.fr", "password");
    Promise.all([user1, user2])
      .then((users) => {
        const jwt = generateJWT({
          id: users[0][0].id,
          email: users[0][0].email,
        });
        chai
          .request(server)
          .get(`/api/lists`)
          .set("Authorization", `Bearer ${jwt}`)
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(200);
            done();
          });
      })
      .catch((e) => {
        console.log(`Error`, e);
      });
  });

  it("should not authorize user to see other's list", (done) => {
    const user1 = createUser("admin@test.fr", "password");
    const user2 = createUser("other@test.fr", "password");

    Promise.all([user1, user2])
      .then((users) => {
        const jwt = generateJWT({
          id: users[0][0].id,
          email: users[0][0].email,
        });
        console.log(`Jwt`, jwt);
        chai
          .request(server)
          .get(`/api/lists`)
          .set("Authorization", `Bearer ${jwt}`)
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(403);
            res.body.message.should.equal("Access forbidden");
            done();
          });
      })
      .catch((e) => {
        console.log(`Error`, e);
      });
  });
});
