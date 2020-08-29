exports.up = function (knex) {
  return knex.schema.createTable("categories", (table) => {
    table.increments();
    table.string("name").notNullable();
    table.integer("user_id").unsigned();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Foreign key
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("categories");
};
