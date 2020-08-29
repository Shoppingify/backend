exports.up = function (knex) {
  return knex.schema.createTable("items", (table) => {
    table.increments();
    table.string("name").notNullable();
    table.string("note");
    table.string("image");
    table.integer("user_id").unsigned().notNullable();
    table.integer("category_id").unsigned().notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Foreign key
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .foreign("category_id")
      .references("id")
      .inTable("categories")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("items");
};
