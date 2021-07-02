exports.up = async function (knex) {
  return knex.schema.createTable("subscriptions", (table) => {
    table.increments("id").primary();
    table.string("guild_id").notNullable();
    table
      .foreign("guild_id")
      .references("guild_id")
      .inTable("announcements")
      .onDelete("CASCADE");
    table.string("broadcaster_id").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  return knex.schema.dropTableIfExists("subscriptions");
};
