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
        // return knex.seed.run();
      });
  });

  afterEach(() => {
    return knex.migrate.rollback();
  });

  it("should not authorize an anonymous user to see lists", (done) => {
    chai
      .request(server)
      .get(`/api/lists`)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(401);
        done();
      });
  });

  it("should authorize a user to see his lists", (done) => {
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

  it("should not authorize an anonymous user to create a list", (done) => {
    chai
      .request(server)
      .post("/api/lists")
      .send({ name: "first" })
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(401);
        done();
      });
  });

  it("should create a list for a user", (done) => {
    createUser("admin@test.fr", "password").then((user) => {
      chai
        .request(server)
        .post("/api/lists")
        .set(
          "Authorization",
          "Bearer " + generateJWT({ id: user[0].id, email: user[0].email })
        )
        .send({ name: "first" })
        .end((err, res) => {
          console.log(`Res body`, res.body);
          should.not.exist(err);
          res.status.should.equal(201);
          res.body.data.name.should.equal("first");

          knex("lists")
            .where({ user_id: user.id })
            .then((lists) => {
              console.log(`Lists`, lists);
              lists.length.should.equal(1);
            });
          done();
        });
    });
  });

  it("should not create a list with invalid data", (done) => {
    createUser("admin@test.fr", "password").then((user) => {
      chai
        .request(server)
        .post("/api/lists")
        .set(
          "Authorization",
          "Bearer " + generateJWT({ id: user[0].id, email: user[0].email })
        )
        .send({})
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(422);
          res.body.status.should.equal("error");
          res.body.message.should.equal('"name" is required');

          done();
        });
    });
  });
});
