exports.up = function (knex) {
  return knex.schema.alterTable('items_lists', function (t) {
    t.unique(['item_id', 'list_id'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropIndex('items_lists', function (t) {
    t.dropUnique(['item_id', 'list_id'])
  })
}
