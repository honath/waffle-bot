const Logger = require("../../lib/logger");

const axios = require("axios");
const { fetchBroadcasterID } = require("../../api/twitch/twitchAPI");

const { LOG_LEVEL, INTERNAL_ACCESS_TOKEN, NODE_ENV } = process.env;

const BASE_URL =
  NODE_ENV === "development"
    ? process.env.DEV_BASE_URL
    : process.env.PROD_BASE_URL;

const logger = new Logger(LOG_LEVEL);

/**
 * Subscribes to a Twitch channel
 * command should look like this:
 * !subtwitch <name>
 */
module.exports = {
  name: "unsubtwitch",
  description:
    "Unsubscribes a guild from a Twitch channel's livestream notifications.",
  usage: "!unsubtwitch <twitch username>",
  cooldown: 60,
  async execute(message, args) {
    /**
     * Returns early if the message is not
     * sent in a guild (Discord server),
     * if the user is not a server administrator,
     * or if the command is missing a user to subscribe to
     */
    if (!message.guild) return;
    if (!message.member.hasPermission("ADMINISTRATOR"))
      return message.reply("You do not have permission to do that.");
    if (!args.length)
      return message.reply("Please specify a Twitch user to unsubscribe from.");

    /**
     * Retrieve the channel name from the command arguments.
     * Only concerned with first argument given, others are ignored.
     */
    const twitchChannel = args[0];

    /* Get guild ID */
    const guild_id = message.guild.id ?? null;

    /* Return early if not sent in a server/guild */
    if (guild_id === null)
      return message.reply(
        "Sorry - I couldn't seem to find this server. Are you sure you're messaging me in one?"
      );

    /* Get broadcaster ID for given Twitch channel from Twitch API */
    const broadcaster_id = await fetchBroadcasterID(twitchChannel);

    /* Request headers containing auth token */
    const headers = {
      Authorization: `Bearer ${INTERNAL_ACCESS_TOKEN}`,
    };

    /* URL for DELETE request to server */
    const DEL_URL = `${BASE_URL}twitch/subscriptions/${guild_id}?broadcaster_id=${broadcaster_id}`;

    return axios
      .delete(DEL_URL, { headers })
      .then((response) => {
        logger.info({
          action: "Deletion successful!",
          location: __dirname,
          status: response.status,
        });

        return message.reply(`Successfully unsubscribed from '${twitchChannel}'`);
      })
      .catch((error) => {
        logger.info({
          action: "Deletion FAILURE!",
          location: __dirname,
          status: error.status,
          notes: [error.message],
        });

        return message.reply(`Failed to unsubscribe from '${twitchChannel}'`);
      });
  },
};
