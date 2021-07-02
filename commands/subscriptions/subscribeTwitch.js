const subscriptionRouter = require("../../api/subscriptionRouter");
const Logger = require("../../lib/logger");

const axios = require("axios");

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
  name: "subtwitch",
  description:
    "Subscribes a guild to a Twitch channel's livestream notifications.",
  usage: "!subtwitch <twitch username>",
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
      return message.reply("Please specify a Twitch user to subscribe to.");

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

    /* Request headers containing auth token */
    const headers = {
      Authorization: `Bearer ${INTERNAL_ACCESS_TOKEN}`,
    };

    /* URL for GET request to server */
    const GET_URL = `${BASE_URL}twitch/announcements/${guild_id}`;

    /* Verify that the announcements channel is already set for this guild */
    const announcementExists = await axios
      .get(GET_URL, { headers })
      .then((response) => {
        logger.info({
          action: "Get Announcement Exists Success",
          location: __dirname,
          status: response.status,
        });

        return true;
      })
      .catch((error) => {
        logger.error({
          action: "Get Announcement Exists Failure",
          location: __dirname,
          status: error.status,
          notes: [`Error: ${error.message}`],
        });

        return false;
      });

    /* Ensure announcement channel is set before continuing with subscription */
    if (await announcementExists) {
      const successMessage =
        "The request to subscribe to that user has been sent. " +
        "It may take a few minutes for the request to process with Twitch. " +
        "Please feel free to check your active subscriptions using this command: " +
        "!listtwitch";

      /* Continue to subscription router with service type and channel name */
      subscriptionRouter("twitch", twitchChannel, guild_id);
      return message.reply(successMessage);
    } else {
      /* Prompt user to set an announcements channel */
      return message.reply(
        "An announcements channel was not detected for this server. Please type '!help announce' for more information."
      );
    }
  },
};
