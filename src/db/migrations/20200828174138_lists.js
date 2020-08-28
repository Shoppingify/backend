exports.up = function (knex) {
  return knex.schema.createTable("lists", (table) => {
    table.increments();
    table.string("name").notNullable();
    table.integer("user_id").unsigned().notNullable();
    table
      .enu("status", ["active", "completed", "canceled"], {
        useNative: true,
        enumName: "list_status",
      })
      .defaultTo("active");
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
  return knex.schema.dropTable("lists");
};
