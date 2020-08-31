exports.up = function (knex) {
  return knex.schema.createTable("items_lists", (table) => {
    table.increments();
    table.integer("item_id").unsigned().notNullable();
    table.integer("list_id").unsigned().notNullable();
    table.boolean("done").defaultTo(false);
    table.integer("quantity").defaultTo(1);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Foreign key
    table
      .foreign("item_id")
      .references("id")
      .inTable("items")
      .onDelete("CASCADE");
    table
      .foreign("list_id")
      .references("id")
      .inTable("lists")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("items_lists");
};
