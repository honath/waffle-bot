exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("subscriptions")
    .del()
    .then(() => {
      /* Seed broadcaster ID is for "dachosenwaffle" on Twitch */
      return knex("subscriptions").insert([
        { guild_id: "824006936613224459", broadcaster_id: "68047106" }, 
        { guild_id: "301606963513393153", broadcaster_id: "68047106" }, 
      ]);
    });
};
