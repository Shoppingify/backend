const { chai, should, server, knex, chaiHttp } = require('./setup')
const {
  createUser,
  generateJWT,
  createList,
  createItems,
} = require('./utils/utils')

describe('categories routes test', () => {
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

  it('should fetch all categories from a user', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    await createItems(user)

    const res = await chai
      .request(server)
      .get('/api/categories')
      .set('Authorization', 'Bearer ' + generateJWT(user))

    res.status.should.equal(200)
    res.body.data.length.should.equal(2)
  })
})
