const { chai, should, server, knex } = require('./setup')
const {
  createUser,
  generateJWT,
  getRandomItemInArray,
  createItems,
  createList,
  createCategory,
} = require('./utils/utils')
const { mtRand } = require('../utils/mtRand')

describe('Handle the items and list for a user', () => {
  beforeEach(() => {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest()
      })
      .then(async () => {
        // await knex.seed.run({ specific: "lists_seed.js" });
        // await knex.seed.run({ specific: "categories_items_seed.js" });
        return Promise.resolve()
      })
      .catch((e) => {
        console.log(`Error seeding`, e)
      })
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })

  it('should add an item to a list', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [list] = await createList(user, 'First list', 'active')
    const items = await createItems(user)

    const res = await chai
      .request(server)
      .post(`/api/lists/${list.id}/items`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        item_id: items[0].id,
        list_id: list.id,
      })

    res.status.should.equal(201)
    res.body.data.item_id.should.equal(items[0].id)

    const itemsInList = await knex('items_lists')
      .where('item_id', items[0].id)
      .andWhere('list_id', list.id)
    itemsInList.length.should.equal(1)
  })

  it('should not add an item to a list if the list is not active', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [list] = await createList(user, 'First list', 'completed')
    const items = await createItems(user)

    const res = await chai
      .request(server)
      .post(`/api/lists/${list.id}/items`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        item_id: items[0].id,
        list_id: list.id,
      })

    res.status.should.equal(400)
    res.body.message.should.equal(
      "You cannot add an item to a list if its status is not 'active'"
    )
  })

  it("should update the item's quantity in a list", async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [list] = await createList(user, 'First list', 'completed')
    const items = await createItems(user)

    const [itemInserted] = await knex('items_lists').insert(
      {
        item_id: items[0].id,
        list_id: list.id,
        quantity: 1,
      },
      ['*']
    )

    const res = await chai
      .request(server)
      .put(`/api/lists/${list.id}/items`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        item_id: itemInserted.item_id,
        list_id: itemInserted.list_id,
        quantity: 3,
      })

    res.status.should.equal(200)
    res.body.data.quantity.should.equal(3)
  })

  it('should delete an item from a list', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [list] = await createList(user, 'First list', 'active')
    const items = await createItems(user)

    const [itemInserted] = await knex('items_lists').insert(
      {
        item_id: items[0].id,
        list_id: list.id,
        quantity: 1,
      },
      ['*']
    )

    const res = await chai
      .request(server)
      .delete(`/api/lists/${list.id}/items`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        item_id: itemInserted.item_id,
        list_id: itemInserted.list_id,
      })

    res.status.should.equal(204)

    const itemsInTheList = await knex('items_lists')
      .where('item_id', itemInserted.item_id)
      .andWhere('list_id', itemInserted.list_id)

    itemsInTheList.length.should.equal(0)
  })

  it('should not be possible to add a deleted item to an active list', async () => {
    const [user] = await createUser('admin@test.fr', 'password')
    const [list] = await createList(user, 'list', 'active')
    const [category] = await createCategory(user)
    const [item] = await knex('items').returning('*').insert({
      name: 'item',
      user_id: user.id,
      category_id: category.id,
      deleted_at: knex.fn.now(),
    })

    const res = await chai
      .request(server)
      .post(`/api/lists/${list.id}/items`)
      .set('Authorization', 'Bearer ' + generateJWT(user))
      .send({
        item_id: item.id,
        list_id: list.id,
      })

    res.status.should.eql(400)
  })
})
