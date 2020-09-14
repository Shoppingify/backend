exports.up = (knex) => {
  return knex.schema.alterTable('users', (table) => {
    table.string('email').nullable().alter()
    table.string('password').nullable().alter()
    table.string('github_id').nullable()
  })
}

exports.down = (knex) => {
  return knex.schema.alterTable('users', (table) => {
    table.string('email').notNullable().alter()
    table.string('password').notNullable().alter()
    table.dropColumn('github_id')
  })
}
