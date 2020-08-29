const { chai, should, server, knex, chaiHttp } = require("./setup");
const { createUser, generateJWT, createList } = require("./utils/utils");

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
        const jwt = generateJWT(users[0][0]);
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
        .set("Authorization", "Bearer " + generateJWT(user[0]))
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
        .set("Authorization", "Bearer " + generateJWT(user[0]))
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

  it("should update a user's list name", (done) => {
    createUser("admin@test.fr", "password").then((user) => {
      createList(user[0], "first").then((list) => {
        chai
          .request(server)
          .put(`/api/lists/${list[0].id}`)
          .set("Authorization", "Bearer " + generateJWT(user[0]))
          .send({
            name: "updated",
          })
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(200);
            res.body.status.should.equal("success");
            res.body.data.name.should.equal("updated");
            done();
          });
      });
    });
  });

  it("should not update a list which not belong to its user", (done) => {
    const user1 = createUser("admin@test.fr", "password");
    const user2 = createUser("other@test.fr", "password");
    Promise.all([user1, user2]).then((users) => {
      const admin = users[0][0];
      const other = users[1][0];
      const jwt = generateJWT(other);
      try {
        createList(admin, "first").then((list) => {
          chai
            .request(server)
            .put(`/api/lists/${list[0].id}`)
            .set("Authorization", `Bearer ${jwt}`)
            .end((err, res) => {
              should.not.exist(err);
              // it should not found the list
              res.status.should.equal(404);
              done();
            });
        });
      } catch (e) {
        console.log(`Error `, e);
      }
    });
  });

  it("should get a list", (done) => {
    createUser("admin@test.fr", "password").then((user) => {
      createList(user[0], "first").then((list) => {
        chai
          .request(server)
          .get(`/api/lists/${list[0].id}`)
          .set("Authorization", "Bearer " + generateJWT(user[0]))
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(200);
            res.body.data.name.should.equal("first");
            res.body.status.should.equal("success");
            res.body.data.should.include.keys(
              "id",
              "name",
              "user_id",
              "status"
            );
            done();
          });
      });
    });
  });

  it("should delete a list", (done) => {
    createUser("admin@test.fr", "password").then((user) => {
      createList(user[0], "first").then((list) => {
        chai
          .request(server)
          .delete(`/api/lists/${list[0].id}`)
          .set("Authorization", "Bearer " + generateJWT(user[0]))
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(204);

            knex("lists")
              .where({ id: list[0].id })
              .then((list) => {
                list.length.should.equal(0);
                done();
              });
          });
      });
    });
  });
});
