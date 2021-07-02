exports.up = async function (knex) {
  return knex.schema.createTable("announcements", (table) => {
    table.string("guild_id").unique().primary().notNullable();
    table.string("channel_id").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  return knex.schema.dropTableIfExists("announcements");
};
