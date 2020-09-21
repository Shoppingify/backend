const { chai, should, server, knex, chaiHttp } = require('./setup')
const {
  createUser,
  generateJWT,
  createList,
  createItems,
  createCategory,
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

  it('should update a category name', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [category] = await createCategory(user)

    const res = await chai
      .request(server)
      .put(`/api/categories/${category.id}`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        name: 'New name',
      })

    res.status.should.eql(200)
    const [newCategory] = await knex('categories')
      .where('id', category.id)
      .select('name')
    newCategory.name.should.equal('New name')
  })

  it('should throw validation error if a name is not valid', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [category] = await createCategory(user)

    const res = await chai
      .request(server)
      .put(`/api/categories/${category.id}`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        name: 'N',
      })

    res.status.should.eql(422)
  })

  it('should throw validation error if the category name already exists', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [category] = await createCategory(user)

    const res = await chai
      .request(server)
      .put(`/api/categories/${category.id}`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        name: category.name,
      })

    res.status.should.eql(422)
    res.body.message.should.equal('You already have a category with this name')
  })

  it('should authorize to update a category if the name is not strictly equal', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [category] = await createCategory(user)

    const res = await chai
      .request(server)
      .put(`/api/categories/${category.id}`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        name: 'Category!',
      })

    res.status.should.eql(200)
  })

  it('should delete a category with all of its items', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [category] = await createCategory(user)
    const [item] = await knex('items').returning('*').insert({
      name: 'item',
      category_id: category.id,
      user_id: user.id,
    })
    const [item2] = await knex('items').returning('*').insert({
      name: 'item2',
      category_id: category.id,
      user_id: user.id,
    })

    const res = await chai
      .request(server)
      .delete(`/api/categories/${category.id}`)
      .set('Authorization', 'Bearer ' + generateJWT(user))

    res.status.should.equal(204)
    const categories = await knex('categories')
      .where('id', category.id)
      .andWhere('deleted_at', null)
    categories.length.should.equal(0)

    const items = await knex('items')
      .where('category_id', category.id)
      .andWhere('deleted_at', null)
    items.length.should.equal(0)
  })
})
