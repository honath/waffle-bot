exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("announcements")
    .del()
    .then(() => {
      return knex("announcements").insert([
        { guild_id: "824006936613224459", channel_id: "824006992368238662" }, 
        { guild_id: "301606963513393153", channel_id: "301608497387274240" }, 
      ]);
    });
};
