process.env.NODE_ENV = "test";

const chai = require("chai");
const should = chai.should();
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const server = require("../server");

describe("test server is running", () => {
  // it("should show a hello world", (done) => {
  //   chai
  //     .request(server)
  //     .get("/")
  //     .end((err, res) => {
  //       res.body.message.should.equal("Hello World");
  //       done();
  //     });
  // });
});
