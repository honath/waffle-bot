const Logger = require("../../lib/logger");

const axios = require("axios");
const { fetchBroadcasterName } = require("../../api/twitch/twitchAPI");

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
  name: "listtwitch",
  description:
    "Lists all active subscriptions for this server, by Twitch login name. Login name can be different than username - login name is used for commands here.",
  usage: "!listtwitch",
  cooldown: 60,
  execute(message, args) {
    /**
     * Returns early if the message is not
     * sent in a guild (Discord server),
     * if the user is not a server administrator,
     * or if the command is missing a user to subscribe to
     */
    if (!message.guild) return;
    if (!message.member.hasPermission("ADMINISTRATOR"))
      return message.reply("You do not have permission to do that.");

    /* Get guild ID */
    const guild_id = message.guild.id ?? null;

    /* Return early if not sent in a server/guild */
    if (guild_id === null)
      return message.reply(
        "Sorry - I couldn't seem to find this server. Are you sure you're messaging me in one?"
      );

    /* Request headers containing auth token */
    const headers = {
      Authorization: `Bearer ${INTERNAL_ACCESS_TOKEN}`,
    };

    /* URL to send GET request to DB */
    const GET_URL = `${BASE_URL}twitch/subscriptions/${guild_id}`;

    return axios
      .get(GET_URL, { headers })
      .then((response) => {
        logger.info({
          action: "Get All Broadcaster IDs Success",
          location: __dirname,
          status: response.status,
          notes: [JSON.stringify(response.data, null, 2)],
        });

        /* Format response to account for Axios "data" nesting */
        return response.data.data;
      })
      .then((broadcasterIDs) => {
        logger.info({
          action: "Mapping Broadcaster Names",
          location: __dirname,
        });

        const broadcasterNames = broadcasterIDs.map(async ({ broadcaster_id }) => {
          const name = await fetchBroadcasterName(broadcaster_id);

          return name;
        });

        return Promise.all(broadcasterNames);
      })
      .then((broadcasterNames) =>
        message.reply(
          `Active Twitch Subscriptions: ${broadcasterNames.join(", ")}`
        )
      )
      .catch((error) => {
        logger.error({
          action: "Get All Broadcaster IDs Failure",
          location: __dirname,
          status: error.status,
          notes: [`Error: ${error.message}`],
        });
      });
  },
};
