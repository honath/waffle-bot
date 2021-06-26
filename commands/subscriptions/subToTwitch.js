const subscriptionRouter = require("../../api/subscriptionRouter");

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
    if (!args.length)
      return message.reply("Please specify a Twitch user to subscribe to.");

    /**
     * Retrieve the channel name from the command arguments.
     * Only concerned with first argument given, others are ignored.
     */
    const twitchChannel = args[0];

    /* Continue to subscription router with service type and channel name */
    subscriptionRouter("twitch", twitchChannel);
  },
};
