const Logger = require("../../lib/logger");

const axios = require("axios");

const { LOG_LEVEL, INTERNAL_ACCESS_TOKEN, NODE_ENV } = process.env;

const BASE_URL =
  NODE_ENV === "development"
    ? process.env.DEV_BASE_URL
    : process.env.PROD_BASE_URL;

const logger = new Logger(LOG_LEVEL);

module.exports = {
  name: "announce",
  description:
    "Sets the channel that this command is used in as the announcements channel",
  execute(message, args) {
    /**
     * Exit early if message not sent in a server OR
     * user does not have administrator privileges
     */
    if (!message.guild) return;
    if (!message.member.hasPermission("ADMINISTRATOR"))
      return message.reply("You do not have permission to do that.");

    /* Retrieve the channel and guild IDs for where this command was sent from */
    const channel_id = message.channel.id ?? null;
    const guild_id = message.guild.id ?? null;

    /**
     * Verify that both the channel and guild
     * IDs were successfully retrieved
     * Exit early with an error message if not
     */
    if (channel_id === null)
      return message.reply("Sorry - I couldn't seem to find this channel.");
    if (guild_id === null)
      return message.reply(
        "Sorry - I couldn't seem to find this server. Are you sure you're messaging me in one?"
      );

    /* URL for sending PUT request - sets announcement channel for this guild in DB */
    const PUT_URL = `${BASE_URL}twitch/announcements/${guild_id}?channel_id=${channel_id}`;

    /* Headers containing auth token */
    const headers = {
      Authorization: `Bearer ${INTERNAL_ACCESS_TOKEN}`,
    };

    /* Send PUT request to server */
    return axios
      .put(PUT_URL, null, { headers })
      .then((response) => {
        logger.info({
          action: "Set Announcement Channel Success",
          location: __dirname,
          status: response.status,
        });

        /* Reply to user with success message */
        if (response.status === 202) {
          /* No changes */
          return message.reply(
            "this channel is already the announcements channel. No changes."
          );
        } else {
          /* New channel set */
          return message.reply(
            "this channel has now been saved as the announcements channel!"
          );
        }
      })
      .catch((error) => {
        logger.error({
          action: "Set Announcement Channel Failure",
          location: __dirname,
          status: error.status,
          notes: [`Error: ${error.message}`],
        });

        /* Reply to user with failure message */
        return message.reply(
          "I apologize, an error occurred and I am unable to set this channel as the announcements channel."
        );
      });
  },
};
