const { chai, should, server, knex, chaiHttp } = require('./setup')
const {
  createUser,
  generateJWT,
  createList,
  createItems,
} = require('./utils/utils')
const { expect } = require('chai')
const { KnexTimeoutError } = require('knex')

describe('Items routes test', () => {
  beforeEach(() => {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest()
      })
      .then(async () => {
        await knex.seed.run({ specific: 'lists_seed.js' })
        await knex.seed.run({ specific: 'categories_items_seed.js' })
        return Promise.resolve()
      })
      .catch((e) => {
        console.log(`Error seeding`, e)
      })
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })

  it("should fetch the user's items with their categories", (done) => {
    knex('users')
      .select(['id', 'email'])
      .then((users) => {
        console.log(`User`, users[0])
        chai
          .request(server)
          .get('/api/items')
          .set('Authorization', 'Bearer ' + generateJWT(users[0]))
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.equal(200)
            res.body.status.should.equal('success')
            expect(res.body.data).to.be.an('array')

            done()
          })
      })
  })

  it('should create an item', (done) => {
    knex('users')
      .select(['id', 'email'])
      .then((users) => {
        console.log(`User`, users[0])
        chai
          .request(server)
          .post('/api/items')
          .send({
            name: 'Coca',
            category: 'beverages',
          })
          .set('Authorization', 'Bearer ' + generateJWT(users[0]))
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.equal(201)
            res.body.status.should.equal('success')
            console.log(`data`, res.body.data)
            res.body.data.should.include.keys(
              'id',
              'name',
              'note',
              'image',
              'user_id',
              'category_id'
            )

            done()
          })
      })
  })

  it('should create an item and a category', (done) => {
    knex('users')
      .select(['id', 'email'])
      .then((users) => {
        console.log(`User`, users[0])
        chai
          .request(server)
          .post('/api/items')
          .send({
            name: 'new Item',
            category: 'New Category',
          })
          .set('Authorization', 'Bearer ' + generateJWT(users[0]))
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.equal(201)
            res.body.status.should.equal('success')
            console.log(`data`, res.body.data)
            res.body.data.should.include.keys(
              'id',
              'name',
              'note',
              'image',
              'user_id',
              'category_id'
            )

            knex('categories')
              .whereRaw('user_id = ? and name = ?', [
                users[0].id,
                'New Category',
              ])
              .then((cat) => {
                cat.length.should.equal(1)
                done()
              })
          })
      })
  })

  it('should not create an item if the request is invalid', (done) => {
    knex('users')
      .select(['id', 'email'])
      .then((users) => {
        console.log(`User`, users[0])
        chai
          .request(server)
          .post('/api/items')
          .send({
            name: 'new Item',
          })
          .set('Authorization', 'Bearer ' + generateJWT(users[0]))
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.equal(422)
            res.body.status.should.equal('error')
            done()
          })
      })
  })

  it('should update an item', (done) => {
    knex('users')
      .select(['id', 'email'])
      .then((users) => {
        knex('items')
          .returning('*')
          .insert({
            name: 'Item',
            category_id: 3,
            user_id: users[0].id,
          })
          .then((item) => {
            console.log(`User`, users[0])
            chai
              .request(server)
              .put(`/api/items/${item[0].id}`)
              .send({
                name: 'new Name',
                category: 'New Category',
              })
              .set('Authorization', 'Bearer ' + generateJWT(users[0]))
              .end((err, res) => {
                should.not.exist(err)
                res.status.should.equal(200)
                res.body.status.should.equal('success')
                res.body.data.should.include.keys(
                  'id',
                  'name',
                  'note',
                  'image',
                  'user_id',
                  'category_id'
                )
                console.log(`Res body`, res.body)
                knex('items')
                  .where('id', item[0].id)
                  .then((newItem) => {
                    newItem[0].name.should.equal('new Name')
                    done()
                  })
              })
          })
      })
  })

  it('should not update an item with invalid request', (done) => {
    knex('users')
      .select(['id', 'email'])
      .then((users) => {
        knex('items')
          .returning('*')
          .insert({
            name: 'Item',
            category_id: 3,
            user_id: users[0].id,
          })
          .then((item) => {
            console.log(`User`, users[0])
            chai
              .request(server)
              .put(`/api/items/${item[0].id}`)
              .send({
                name: ' ',
                category: '',
              })
              .set('Authorization', 'Bearer ' + generateJWT(users[0]))
              .end((err, res) => {
                should.not.exist(err)
                res.status.should.equal(422)
                res.body.status.should.equal('error')
                done()
              })
          })
      })
  })
  it('should allow a user to soft delete an item', (done) => {
    knex('users')
      .select(['id', 'email'])
      .then((users) => {
        knex('items')
          .returning('*')
          .insert({
            name: 'Item',
            category_id: 3,
            user_id: users[0].id,
          })
          .then((item) => {
            // console.log(`Item`, item);
            chai
              .request(server)
              .delete(`/api/items/${item[0].id}`)
              .set('Authorization', 'Bearer ' + generateJWT(users[0]))
              .end((err, res) => {
                should.not.exist(err)
                res.status.should.equal(204)

                knex('items')
                  .where('id', item[0].id)
                  .then((items) => {
                    item.length.should.equal(1)
                    items[0].deleted_at.should.not.equal(null)
                    done()
                  })
              })
          })
      })
  })

  it('should not fetch the deleted items', async () => {
    const users = await knex('users').select(['id', 'email'])
    const [item] = await knex('items').returning('*').insert({
      name: 'Item',
      category_id: 4,
      user_id: users[0].id,
      deleted_at: knex.fn.now(),
    })

    const res = await chai
      .request(server)
      .get('/api/items')
      .set('Authorization', 'Bearer ' + generateJWT(users[0]))

    res.body.data[0].items.findIndex((el) => el.id === item.id).should.equal(-1)
  })
})
