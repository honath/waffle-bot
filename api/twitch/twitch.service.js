const knex = require("../../db/connection");

/**
 * Log a new subscription for a server/broadcaster pair
 * @param {Object} newSubscription 
 * @returns {Promise} Knex DB Query
 */
function createSubscription(newSubscription) {
  return knex("subscriptions").insert(newSubscription).returning("*");
}

/**
 * Create a new announcement channel entry
 * @param {Object} newServerInfo 
 * @returns {Promise} Knex DB Query
 */
function setAnnouncementChannel(newServerInfo) {
  return knex("announcements").insert(newServerInfo).returning("*");
}

/**
 * Change/Update an existing announcement channel entry 
 * @param {String} guild_id 
 * @param {String} channel_id 
 * @returns {Promise} Knex DB Query
 */
function updateAnnouncementChannel(guild_id, channel_id) {
  return knex("announcements")
    .where({ guild_id: guild_id })
    .update({ channel_id })
    .returning("*");
}

/**
 * Retrieve announcement entry by guild ID
 * @param {String} guild_id 
 * @returns {Promise} Knex DB Query
 */
function readAnnouncement(guild_id) {
  return knex("announcements")
    .where({ guild_id: guild_id })
    .select("*")
    .first();
}

/**
 * Get active subscription for a specified server/broadcaster pair 
 * @param {String} guild_id 
 * @param {String} broadcaster_id 
 * @returns {Promise} Knex DB Query
 */
function getSubscriptionByGuildAndBroadcasterIDs(guild_id, broadcaster_id) {
  return knex("subscriptions")
    .where({ guild_id: guild_id, broadcaster_id: broadcaster_id })
    .select("*")
    .first();
}

/**
 * Get all active subscriptions for a given Guild/Server
 * @param {String} guild_id 
 * @returns {Promise} Knex DB Query
 */
function listSubscriptionsByGuildID(guild_id) {
  return knex("subscriptions")
    .where({ guild_id: guild_id })
    .select("broadcaster_id");
}

/**
 * Get all guild + channel IDs for a given broadcaster subscription
 * @param {String} broadcaster_id 
 * @returns {Promise} Knex DB Query
 */
function listChannelsForGivenSubscription(broadcaster_id) {
  return knex("announcements as a")
    .join("subscriptions as s", "a.guild_id", "s.guild_id")
    .where({ "s.broadcaster_id": broadcaster_id })
    .select("a.channel_id");
}

/**
 * Delete a server/broadcaster pair subscription
 * @param {String} guild_id 
 * @param {String} broadcaster_id 
 * @returns {Promise} Knex DB Query
 */
function unsubscribe(guild_id, broadcaster_id) {
  return knex("subscriptions")
    .where({
      guild_id: guild_id,
      broadcaster_id: broadcaster_id,
    })
    .del();
}

module.exports = {
  createSubscription,
  createAnnouncement: setAnnouncementChannel,
  updateAnnouncement: updateAnnouncementChannel,
  readAnnouncement,
  readSub: getSubscriptionByGuildAndBroadcasterIDs,
  listSubsByGuild: listSubscriptionsByGuildID,
  listSubsForBroadcaster: listChannelsForGivenSubscription,
  unsubscribe,
};
