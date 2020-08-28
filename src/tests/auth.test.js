process.env.NODE_ENV = "test";

const chai = require("chai");
const should = chai.should();
const chaiHttp = require("chai-http");
const bcrypt = require("bcryptjs");

chai.use(chaiHttp);

const server = require("../server");
const knex = require("../db/connection");

const userData = {
  email: "admin@test.fr",
  password: "password",
};

describe("User authentication", () => {
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

  it("should register an user", (done) => {
    chai
      .request(server)
      .post("/api/register")
      .send(userData)
      .end((err, res) => {
        should.not.exist(err);

        res.status.should.equal(201);
        res.body.status.should.equal("success");
        console.log(`res.body`, res.body.data);
        res.body.data.email.should.equal(userData.email);
        done();
      });
  });

  it("should not register an user with an email already existing", (done) => {
    createUser("admin@test.fr", "password").then(() => {
      chai
        .request(server)
        .post("/api/register")
        .send(userData)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(422);
          done();
        });
    });
  });

  it("should not register an user with invalid data", (done) => {
    chai
      .request(server)
      .post("/api/register")
      .send({ email: "email" })
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(422);
        res.body.field.should.equal("email");
        res.body.message.should.equal('"email" must be a valid email');
        done();
      });
  });

  it("should login a user", (done) => {
    createUser("admin@test.fr", "password").then(() => {
      chai
        .request(server)
        .post("/api/login")
        .send(userData)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(200);
          res.body.data.should.include.keys("user", "token");
          done();
        });
    });
  });

  it("should not logged in an user with invalid credentials", (done) => {
    createUser("admin@test.fr", "password").then(() => {
      chai
        .request(server)
        .post("/api/login")
        .send({
          email: "test@test.fr",
          password: "password",
        })
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(401);
          res.body.message.should.equal("Invalid credentials");
          done();
        });
    });
  });

  it("should throw login validation error", (done) => {
    chai
      .request(server)
      .post("/api/login")
      .send({
        email: "test@test.fr",
      })
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(422);
        console.log(`res.body`, res.body);
        res.body.field.should.equal("password");
        res.body.message.should.equal('"password" is required');
        done();
      });
  });
});

const createUser = (email, password) => {
  const hash = bcrypt.hashSync(password, 10);
  return knex("users").insert({
    email,
    password: hash,
  });
};
