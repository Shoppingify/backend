exports.up = function (knex) {
  return knex.schema.alterTable('categories', (table) => {
    table.timestamp('deleted_at').nullable().defaultTo(null)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('categories', (table) => {
    table.dropColumn('deleted_at')
  })
}
