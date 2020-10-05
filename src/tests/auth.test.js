const { chai, should, server, knex } = require('./setup')
const { createUser, generateJWT } = require('./utils/utils')

const userData = {
  email: 'admin@test.fr',
  password: 'password',
}

describe('User authentication', () => {
  beforeEach(() => {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest()
      })
      .then(() => {
        // return knex.seed.run();
      })
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })

  it('should register a user', (done) => {
    chai
      .request(server)
      .post('/api/register')
      .send(userData)
      .end((err, res) => {
        should.not.exist(err)

        res.status.should.equal(201)
        res.body.status.should.equal('success')
        //
        res.body.data.user.email.should.equal(userData.email)
        done()
      })
  })

  it('should not register a user with an email already existing', (done) => {
    createUser('admin@test.fr', 'password').then((val) => {
      chai
        .request(server)
        .post('/api/register')
        .send(userData)
        .end((err, res) => {
          should.not.exist(err)
          res.status.should.equal(422)
          done()
        })
    })
  })

  it('should not register a user with invalid data', (done) => {
    chai
      .request(server)
      .post('/api/register')
      .send({ email: 'email' })
      .end((err, res) => {
        should.not.exist(err)
        res.status.should.equal(422)
        res.body.field.should.equal('email')
        res.body.message.should.equal('"email" must be a valid email')
        done()
      })
  })

  it('should login a user', (done) => {
    createUser('admin@test.fr', 'password').then(() => {
      chai
        .request(server)
        .post('/api/login')
        .send(userData)
        .end((err, res) => {
          should.not.exist(err)
          res.status.should.equal(200)
          res.body.data.should.include.keys('user', 'token')
          done()
        })
    })
  })

  it('should not logged in a user with invalid credentials', (done) => {
    createUser('admin@test.fr', 'password').then(() => {
      chai
        .request(server)
        .post('/api/login')
        .send({
          email: 'test@test.fr',
          password: 'password',
        })
        .end((err, res) => {
          should.not.exist(err)
          res.status.should.equal(401)
          res.body.message.should.equal('Invalid credentials')
          done()
        })
    })
  })

  it('should throw login validation error', (done) => {
    chai
      .request(server)
      .post('/api/login')
      .send({
        email: 'test@test.fr',
      })
      .end((err, res) => {
        should.not.exist(err)
        res.status.should.equal(422)

        res.body.field.should.equal('password')
        res.body.message.should.equal('"password" is required')
        done()
      })
  })

  it("should fetch the user's informations", (done) => {
    createUser('admin@test.fr', 'password').then((user) => {
      chai
        .request(server)
        .get('/api/me')
        .set('Authorization', 'Bearer ' + generateJWT(user[0]))
        .end((err, res) => {
          should.not.exist(err)
          res.status.should.equal(200)
          res.body.data.should.include.keys(
            'id',
            'email',
            'created_at',
            'updated_at'
          )
          res.body.data.should.not.include.keys('password')
          done()
        })
    })
  })

  it('should add some default categories and an active list when after the user registration', async () => {
    const res = await chai.request(server).post('/api/register').send({
      email: 'admin@test.fr',
      password: 'password',
    })

    const user = res.body.data.user

    const defaultCategories = await knex('categories').where('user_id', user.id)
    const defaultLists = await knex('lists')
      .where('user_id', user.id)
      .andWhere('status', 'active')

    defaultCategories.length.should.equal(3)
    defaultLists.length.should.equal(1)
  })
})
