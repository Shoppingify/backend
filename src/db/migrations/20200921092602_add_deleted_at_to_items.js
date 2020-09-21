exports.up = function (knex) {
  return knex.schema.alterTable('items', (table) => {
    table.timestamp('deleted_at').nullable().defaultTo(null)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('items', (table) => {
    table.dropColumn('deleted_at')
  })
}
